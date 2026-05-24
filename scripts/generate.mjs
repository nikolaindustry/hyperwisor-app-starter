#!/usr/bin/env node
/**
 * Generate a bespoke device UI for a product, automatically.
 *
 *   npm run generate <productId>
 *
 * What it does:
 *   1. Loads Hyperwisor + Anthropic keys from .env.local
 *   2. Runs `npm run inspect <productId>` if the spec is missing
 *   3. Spawns the Claude Agent SDK with this repo's CLAUDE.md playbook
 *   4. The agent reads the spec, generates the screen, registers it
 *   5. Verifies with `npx tsc --noEmit`
 *
 * Phase 1 of the path toward the hosted Hyperwisor App Studio.
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { query } from "@anthropic-ai/claude-agent-sdk";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// --- Env -------------------------------------------------------------
function loadEnv() {
  const path = resolve(ROOT, ".env.local");
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
const HW_KEY = env.VITE_HW_API_KEY || process.env.VITE_HW_API_KEY;

if (!ANTHROPIC_API_KEY) {
  // The Agent SDK has multiple auth paths (subscription, OAuth, env). Warn
  // but proceed — the SDK will throw a clear error if it really can't auth.
  console.warn(
    "  ⚠ ANTHROPIC_API_KEY not in .env.local — falling back to any local\n" +
      "    Claude credentials. Set the key explicitly if auth fails.\n",
  );
}
if (!HW_KEY || HW_KEY === "DEMO") {
  console.error(
    "\n  ✗ Hyperwisor keys not set in .env.local.\n" +
      "    Copy .env.example → .env.local and fill in VITE_HW_API_KEY + VITE_HW_SECRET_KEY.\n",
  );
  process.exit(1);
}
// Hand off to subprocesses + SDK.
if (ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = ANTHROPIC_API_KEY;
process.env.VITE_HW_API_KEY = env.VITE_HW_API_KEY;
process.env.VITE_HW_SECRET_KEY = env.VITE_HW_SECRET_KEY;
if (env.VITE_HW_API_BASE_URL) process.env.VITE_HW_API_BASE_URL = env.VITE_HW_API_BASE_URL;

// --- Arg + spec ------------------------------------------------------
const productId = process.argv[2];
if (!productId) {
  console.error(
    "\n  Usage: npm run generate <productId>\n" +
      "  Find product ids with: npm run inspect\n",
  );
  process.exit(1);
}

const specPath = resolve(ROOT, `.hyperwisor/product-${productId}.json`);
// Always re-inspect — keeps the spec on the latest extractor format and
// catches any product changes the manufacturer made since last run.
console.log(`\n  Inspecting product…\n`);
await runCmd("node", ["scripts/inspect-product.mjs", productId]);
if (!existsSync(specPath)) {
  console.error(`\n  ✗ Inspector did not produce a spec for ${productId}.\n`);
  process.exit(1);
}

const spec = JSON.parse(readFileSync(specPath, "utf8"));
const productName = spec.product?.product_name || productId;

// --- Prompt ----------------------------------------------------------
const prompt = `
Build the bespoke device UI for product "${productName}" (id: ${productId}).

You are operating inside the Hyperwisor app starter kit. Read these files
in this order before writing any code:

  1. CLAUDE.md — the playbook you must follow exactly
  2. .hyperwisor/product-${productId}.json — the product spec
       Focus on:
         • capabilities.controls  → manufacturer-authored titles + widgetTypes
                                    (this is the truth source, not commandsApi)
         • capabilities.displays  → telemetry surfaces with titles + units
         • capabilities.commands  → raw vocabulary as cross-reference
  3. src/screens/device/examples/SmartThermostatScreen.tsx — quality reference
  4. src/screens/device/smart-bike/SmartBikeScreen.tsx — another example
  5. src/components/blocks/index.ts — the blocks you must compose with

Then do this:
  • Create src/screens/device/<product-slug>/<ProductName>Screen.tsx
    (kebab-case slug, PascalCase component, plus any small per-product helpers)
  • Register it in src/screens/device/productScreenRegistry.ts (one new line
    that maps the product id to the screen)
  • Run \`npx tsc --noEmit\` via Bash and fix every error before reporting done

Hard rules (do not violate):
  • Compose from @/components/blocks; never hard-code colors or pixel values
  • Follow capabilities.controls verbatim — widget titles + widgetType drive
    label + affordance (switch → ToggleTile, button → HoldButton, etc.)
  • Send commands via sdk.sendCommand with the real shape:
      [{ command, actions: [{ action, params }] }]
  • Flag spec gaps in comments — never silently guess
  • Don't touch the foundation (src/auth/**, src/lib/**, onboarding/list/auth screens)

Report success only after \`npx tsc --noEmit\` passes cleanly.
`.trim();

// --- Run -------------------------------------------------------------
console.log(`\n  ⚡ Generating UI for "${productName}"`);
console.log(`     product id: ${productId}\n`);

const ac = new AbortController();
process.on("SIGINT", () => {
  console.log("\n  Aborting…");
  ac.abort();
});

let turns = 0;
let lastText = "";

try {
  const result = query({
    prompt,
    options: {
      cwd: ROOT,
      allowedTools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
      permissionMode: "acceptEdits",
      maxTurns: 80,
      model: process.env.HYPERWISOR_AGENT_MODEL || "sonnet",
      abortController: ac,
    },
  });

  for await (const msg of result) {
    if (msg.type === "assistant") {
      turns++;
      const blocks = msg.message?.content ?? [];
      for (const b of blocks) {
        if (b.type === "text" && b.text?.trim()) {
          lastText = b.text.trim();
          const short = lastText.length > 220 ? lastText.slice(0, 220) + "…" : lastText;
          console.log(`\n  💭 ${short}`);
        } else if (b.type === "tool_use") {
          const argStr = compactArgs(b.input);
          console.log(`  → ${b.name}${argStr}`);
        }
      }
    } else if (msg.type === "result") {
      if (msg.subtype === "success") {
        const cost = (msg.total_cost_usd ?? 0).toFixed(4);
        const secs = ((msg.duration_ms ?? 0) / 1000).toFixed(1);
        console.log(
          `\n  ✓ Generated in ${msg.num_turns} turns · ${secs}s · $${cost}\n`,
        );
        writeLastRun({ productId, productName, ok: true, turns: msg.num_turns });
      } else {
        console.error(`\n  ✗ Agent ended with error: ${msg.subtype}\n`);
        if (lastText) console.error(`    ${lastText}\n`);
        writeLastRun({ productId, productName, ok: false, error: msg.subtype });
        process.exit(2);
      }
    }
  }
} catch (e) {
  console.error(`\n  ✗ ${e.message}\n`);
  process.exit(1);
}

// --- Helpers ---------------------------------------------------------
function compactArgs(input) {
  if (!input || typeof input !== "object") return "";
  const interesting = ["file_path", "command", "path", "pattern"];
  for (const k of interesting) {
    if (input[k]) {
      const v = String(input[k]);
      return ` ${k}=${v.length > 70 ? v.slice(0, 70) + "…" : v}`;
    }
  }
  const s = JSON.stringify(input);
  return s.length > 80 ? ` ${s.slice(0, 80)}…` : ` ${s}`;
}

function runCmd(cmd, args) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, {
      stdio: "inherit",
      cwd: ROOT,
      shell: process.platform === "win32",
    });
    p.on("exit", (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited ${c}`))));
  });
}

function writeLastRun(info) {
  try {
    writeFileSync(
      resolve(ROOT, ".hyperwisor/last-generation.json"),
      JSON.stringify({ at: new Date().toISOString(), ...info }, null, 2),
    );
  } catch {
    /* non-fatal */
  }
}
