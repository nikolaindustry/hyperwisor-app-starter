/**
 * Bespoke device screen — Smart Dual-Socket Plug.
 *
 * Generated for product "Smart Dual-Socket Plug"
 * (232d1168-8ba2-4aa4-a50d-c87dd332e8a4) · model SDP-2000.
 *
 * Controls sourced from the manufacturer's dashboard_config widgets
 * (capabilities.controls was unavailable — /commands endpoint failed):
 *
 *   "All switch"   → switch  → setPower / turnOn|turnOff  { outletId: "0" }  (both outlets)
 *   "CH1  switch"  → switch  → setPower / turnOn|turnOff  { outletId: "1" }  (outlet 1)
 *   "CH2 switch"   → switch  → setPower / turnOn|turnOff  { outletId: "2" }  (outlet 2)
 *   "Both"         → button  → setPower / turnOn  (push)  { outletId: "0" }
 *                            → setPower / turnOff (release){ outletId: "0" }
 *
 * SPEC GAPS — please confirm with the manufacturer:
 *   1. The product description mentions energy monitoring, but the telemetry
 *      endpoint returned an error in the spec. Provide the sensor key names
 *      (e.g. watts, kWh) so live energy metrics can be added.
 *   2. The description also mentions scheduling. No schedule command exists in
 *      the spec — share the schedule command shape to add a scheduling UI.
 *   3. outletId "0" = both outlets (per firmware description) — please confirm.
 *   4. Device events are not exposed by the manufacturer API; confirm which
 *      state-change events the UI should react to.
 */

import * as React from "react";
import { Plug, Zap } from "lucide-react";
import type { DeviceScreenProps } from "../types";
import { sdk } from "@/lib/sdk";
import { useToast } from "@/components/ui/Toast";
import {
  Section,
  StatusHeader,
  MetricTile,
  MetricGrid,
  ToggleTile,
  HoldButton,
  Card,
} from "@/components/blocks";

export function SmartDualSocketPlugScreen({ device }: DeviceScreenProps) {
  const toast = useToast();

  // ─── Optimistic outlet state ────────────────────────────────────────────────
  // Seeded to off; update once the platform exposes device-reported state.
  const [ch1, setCh1] = React.useState(false);
  const [ch2, setCh2] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  // Derived
  const onCount = (ch1 ? 1 : 0) + (ch2 ? 1 : 0);
  const allOn = ch1 && ch2;
  const anyOn = ch1 || ch2;

  // ─── Command helper ──────────────────────────────────────────────────────────
  /**
   * Fire a setPower command; apply optimistic state before the round-trip,
   * toast on error.
   */
  async function sendPower(
    action: "turnOn" | "turnOff",
    outletId: string,
    key: string,
    apply: () => void,
  ) {
    setBusy(key);
    apply(); // optimistic — state updates immediately
    try {
      await sdk.sendCommand(device.id, [
        {
          command: "setPower",
          actions: [{ action, params: { outletId } }],
        },
      ]);
    } catch (err) {
      toast.push((err as Error).message || "Command failed", "danger");
    } finally {
      setBusy(null);
    }
  }

  // ─── Per-control handlers ────────────────────────────────────────────────────

  /** "All switch" — latching, targets outletId "0" (both outlets). */
  function toggleAll(next: boolean) {
    void sendPower(next ? "turnOn" : "turnOff", "0", "all", () => {
      setCh1(next);
      setCh2(next);
    });
  }

  /** "CH1  switch" — latching, targets outletId "1". */
  function toggleCh1(next: boolean) {
    void sendPower(next ? "turnOn" : "turnOff", "1", "ch1", () => setCh1(next));
  }

  /** "CH2 switch" — latching, targets outletId "2". */
  function toggleCh2(next: boolean) {
    void sendPower(next ? "turnOn" : "turnOff", "2", "ch2", () => setCh2(next));
  }

  /**
   * "Both" button — momentary (hold to power on, release to turn off).
   * The manufacturer wired push → turnOn / release → turnOff for outletId "0".
   */
  function handleBothPress() {
    void sendPower("turnOn", "0", "both", () => {
      setCh1(true);
      setCh2(true);
    });
  }
  function handleBothRelease() {
    void sendPower("turnOff", "0", "both", () => {
      setCh1(false);
      setCh2(false);
    });
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <StatusHeader
        name={device.device_name}
        productName={device.iot_products?.product_name}
        online={device.is_online ?? false}
        lastSeen={device.last_seen}
      />

      {/* ── Hero — active outlet count ── */}
      <MetricTile
        size="hero"
        label="Active outlets"
        icon={<Zap size={13} />}
        tone={anyOn ? "primary" : "default"}
        value={String(onCount)}
        unit="/ 2"
        hint={
          onCount === 0
            ? "Both outlets off"
            : onCount === 1
              ? "One outlet powered on"
              : "Both outlets powered on"
        }
      />

      {/* ── Individual outlet switches ── */}
      <Section title="Outlets">
        <div className="flex flex-col gap-2">
          {/* "CH1  switch" — outlet 1 */}
          <ToggleTile
            label="CH1 switch"
            description={ch1 ? "Outlet 1 is on" : "Outlet 1 is off"}
            icon={<Plug size={18} />}
            value={ch1}
            loading={busy === "ch1"}
            onChange={toggleCh1}
          />

          {/* "CH2 switch" — outlet 2 */}
          <ToggleTile
            label="CH2 switch"
            description={ch2 ? "Outlet 2 is on" : "Outlet 2 is off"}
            icon={<Plug size={18} />}
            value={ch2}
            loading={busy === "ch2"}
            onChange={toggleCh2}
          />
        </div>
      </Section>

      {/* ── Master controls — "All switch" + "Both" button ── */}
      <Section title="Master">
        <div className="flex flex-col gap-2">
          {/* "All switch" — latching toggle for both outlets */}
          <ToggleTile
            label="All switch"
            description={allOn ? "Both outlets on" : "Both outlets off"}
            icon={<Zap size={18} />}
            value={allOn}
            loading={busy === "all"}
            onChange={toggleAll}
          />

          {/* "Both" — momentary: hold keeps both on, release cuts power */}
          <HoldButton
            label="Both"
            description="Hold to power both outlets on; release to turn off"
            icon={<Zap size={18} />}
            loading={busy === "both"}
            onPress={handleBothPress}
            onRelease={handleBothRelease}
          />
        </div>
      </Section>

      {/* ── Status summary grid ── */}
      <Section title="Status">
        <MetricGrid>
          <MetricTile
            label="Outlet 1"
            value={ch1 ? "On" : "Off"}
            tone={ch1 ? "success" : "default"}
          />
          <MetricTile
            label="Outlet 2"
            value={ch2 ? "On" : "Off"}
            tone={ch2 ? "success" : "default"}
          />
        </MetricGrid>
      </Section>

      {/* ── Product footer ── */}
      <Card>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Plug size={14} />
          <span>
            {device.iot_products?.product_name}
            {device.iot_products?.model_number
              ? ` · ${device.iot_products.model_number}`
              : ""}
          </span>
        </div>
      </Card>
    </div>
  );
}
