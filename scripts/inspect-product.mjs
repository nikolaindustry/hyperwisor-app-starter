#!/usr/bin/env node
/**
 * Product inspector.
 *
 *   npm run inspect              → lists all products on the account
 *   npm run inspect <productId>  → writes a full spec to .hyperwisor/product-<id>.json
 *
 * The AI agent runs this to learn a product's capabilities — commands,
 * actions, parameters, dashboard, and a sample of real telemetry — before
 * generating that product's UI. See CLAUDE.md.
 *
 * Reads credentials from .env.local (VITE_HW_API_KEY / VITE_HW_SECRET_KEY).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// --- Load .env.local ---------------------------------------------------
function loadEnv() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const API_KEY = env.VITE_HW_API_KEY;
const SECRET_KEY = env.VITE_HW_SECRET_KEY;
const BASE_URL =
  env.VITE_HW_API_BASE_URL ||
  "https://cgsuxlbravclbbpnvfky.supabase.co/functions/v1";

if (!API_KEY || !SECRET_KEY || API_KEY === "DEMO") {
  console.error(
    "\n  ✗ No API keys found.\n" +
      "    Copy .env.example to .env.local and fill in VITE_HW_API_KEY\n" +
      "    and VITE_HW_SECRET_KEY, then run this again.\n",
  );
  process.exit(1);
}

// --- API helper --------------------------------------------------------
async function api(path) {
  const res = await fetch(`${BASE_URL}/manufacturer-api${path}`, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "x-secret-key": SECRET_KEY,
    },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Non-JSON response from ${path}: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status} on ${path}`);
  return json;
}

// --- Capability extraction --------------------------------------------
/**
 * The manufacturer-api /commands endpoint is currently unreliable, but the
 * product's canvas dashboard config carries the real command vocabulary
 * inside each widget's `widgetEvents`. We mine it here so the AI agent gets
 * an accurate, deduplicated list of what the device can actually do.
 *
 * Command wire format (sent over WebSocket to the device):
 *   { targetId, payload: { commands: [{ command, actions: [{action, params}] }] } }
 */
function extractCapabilities(dashboardConfig) {
  const commands = {}; // command -> { actions: { action -> paramSamples } }
  const dataBindings = []; // display widgets that read telemetry

  if (!dashboardConfig?.pages) return { commands, dataBindings };

  for (const page of dashboardConfig.pages) {
    for (const widget of page.widgets || []) {
      const cfg = widget.config || {};

      // Control vocabulary from widget events
      const events = cfg.widgetEvents || [];
      for (const ev of events) {
        for (const target of ev.targets || []) {
          for (const cmd of target.payload?.commands || []) {
            const cName = cmd.command || "unknown";
            commands[cName] ||= { actions: {} };
            for (const act of cmd.actions || []) {
              const aName = act.action || "unknown";
              commands[cName].actions[aName] ||= { paramSamples: {} };
              Object.assign(
                commands[cName].actions[aName].paramSamples,
                act.params || {},
              );
            }
          }
        }
      }

      // Display widgets — note what telemetry they read
      if (["gauge", "status", "chart", "label", "heatmap"].includes(widget.type)) {
        dataBindings.push({
          widgetType: widget.type,
          title: widget.title,
          dataSource: cfg.dataSource || null,
          websocketTopic: cfg.websocketTopic || null,
          unit: cfg.unit || cfg.suffix || null,
        });
      }
    }
  }
  return { commands, dataBindings };
}

// --- Main --------------------------------------------------------------
const productId = process.argv[2];

async function listProducts() {
  const { products = [] } = await api("/products");
  if (products.length === 0) {
    console.log("\n  No products found on this account.\n");
    return;
  }
  console.log(`\n  ${products.length} product(s) on this account:\n`);
  for (const p of products) {
    console.log(`  • ${p.product_name}`);
    console.log(`    id:       ${p.id}`);
    console.log(`    category: ${p.product_category || "—"}`);
    console.log(`    model:    ${p.model_number || "—"}\n`);
  }
  console.log("  Inspect one with:  npm run inspect <productId>\n");
}

async function inspectProduct(id) {
  console.log(`\n  Inspecting product ${id} …\n`);

  const { products = [] } = await api("/products");
  const product = products.find((p) => p.id === id);
  if (!product) {
    console.error(`  ✗ Product ${id} not found on this account.\n`);
    process.exit(1);
  }
  // product_image can be a huge base64 blob — drop it from the spec.
  delete product.product_image;
  console.log(`  ✓ product info        (${product.product_name})`);

  const spec = {
    generatedAt: new Date().toISOString(),
    product,
    commandsApi: [],
    capabilities: { commands: {}, dataBindings: [] },
    dashboard: null,
    sensorSample: [],
    notes: [],
  };

  // Commands → actions → parameters (dedicated endpoint — often unreliable)
  try {
    const { commands = [] } = await api(`/products/${id}/commands`);
    spec.commandsApi = commands;
    console.log(`  ✓ commands API        (${commands.length} commands)`);
  } catch (e) {
    console.log(`  ⚠ commands API        (${e.message} — using dashboard fallback)`);
    spec.notes.push(`/commands endpoint failed: ${e.message}`);
  }

  // Dashboard config — canvas designer output. We do NOT render it; we mine
  // it for the real command vocabulary (see extractCapabilities).
  try {
    const { dashboard } = await api(`/products/${id}/dashboard`);
    spec.dashboard = dashboard;
    if (dashboard?.dashboard_config) {
      spec.capabilities = extractCapabilities(dashboard.dashboard_config);
      const cmdCount = Object.keys(spec.capabilities.commands).length;
      console.log(`  ✓ capabilities        (${cmdCount} commands mined from dashboard)`);
    } else {
      console.log(`  · dashboard           (none — capabilities unknown)`);
      spec.notes.push(
        "No dashboard config. Ask the manufacturer for the command vocabulary.",
      );
    }
  } catch (e) {
    console.log(`  ⚠ dashboard           (${e.message})`);
  }

  // Sensor data sample — shows the real telemetry shape
  try {
    const r = await api(`/sensor-data?product_id=${id}&limit=20`);
    spec.sensorSample = r.sensor_data || r.data || [];
    console.log(`  ✓ sensor sample       (${spec.sensorSample.length} readings)`);
  } catch (e) {
    console.log(`  ⚠ sensor sample       (${e.message})`);
    spec.notes.push(`sensor sample unavailable: ${e.message}`);
  }

  spec.notes.push(
    "Product-level EVENTS are not exposed by the manufacturer API. " +
      "Ask the manufacturer which device events the UI should react to.",
  );

  const outDir = resolve(root, ".hyperwisor");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `product-${id}.json`);
  writeFileSync(outPath, JSON.stringify(spec, null, 2));

  console.log(`\n  → Spec written to .hyperwisor/product-${id}.json`);
  console.log(
    `\n  Next: ask your AI agent to "build the UI for product ${id}".`,
  );
  console.log(`  The agent reads CLAUDE.md and this spec file.\n`);
}

try {
  if (productId) await inspectProduct(productId);
  else await listProducts();
} catch (e) {
  console.error(`\n  ✗ ${e.message}\n`);
  process.exit(1);
}
