/**
 * Bespoke device screen — 5-Channel Gang Switch + Fan.
 *
 * Generated for product "5ch_gang_with_1_fan"
 * (4fb8f51a-0f84-4cae-9060-27d8949360e2).
 *
 * Command protocol (from the inspected spec):
 *   command "Operate", action "ON" | "OFF", params { relay: "<n>" }
 *
 * SPEC GAP — read this:
 *   The manufacturer's dashboard only wired up ONE switch (relay "1").
 *   Channels 2–5 below are extrapolated from the product name
 *   ("5ch_gang_with_1_fan") and description ("THIS IS 4 RELAY 1 FAN")
 *   using the same parameterised "Operate" command. Confirm with the
 *   manufacturer:
 *     - exact channel count and which relay number is the fan
 *     - real channel names (Living Room Light, etc.)
 *     - whether the fan supports speed control (no speed command exists
 *       in the spec — it is treated as on/off here)
 *   Edit the CHANNELS array below to match the hardware.
 */

import * as React from "react";
import { Fan, Lightbulb, Power } from "lucide-react";
import type { DeviceScreenProps } from "../types";
import type { DeviceAction } from "@/lib/types";
import { sdk } from "@/lib/sdk";
import { useToast } from "@/components/ui/Toast";
import {
  Section,
  StatusHeader,
  ToggleTile,
  Button,
  Card,
} from "@/components/blocks";

type Channel = { relay: string; label: string; kind: "switch" | "fan" };

/** Confirmed: relay "1". Channels 2–5 extrapolated — see file header. */
const CHANNELS: Channel[] = [
  { relay: "1", label: "Channel 1", kind: "switch" },
  { relay: "2", label: "Channel 2", kind: "switch" },
  { relay: "3", label: "Channel 3", kind: "switch" },
  { relay: "4", label: "Channel 4", kind: "switch" },
  { relay: "5", label: "Fan", kind: "fan" },
];

export function GangSwitchScreen({ device }: DeviceScreenProps) {
  const toast = useToast();
  const [state, setState] = React.useState<Record<string, boolean>>({});
  const [busy, setBusy] = React.useState<string | null>(null);

  const onCount = CHANNELS.filter((c) => state[c.relay]).length;

  /** Send one or more Operate actions. */
  async function operate(actions: DeviceAction[], key: string) {
    setBusy(key);
    try {
      await sdk.sendCommand(device.id, [{ command: "Operate", actions }]);
    } catch (err) {
      toast.push((err as Error).message || "Command failed", "danger");
    } finally {
      setBusy(null);
    }
  }

  function toggle(relay: string, next: boolean) {
    setState((prev) => ({ ...prev, [relay]: next })); // optimistic
    void operate([{ action: next ? "ON" : "OFF", params: { relay } }], `ch-${relay}`);
  }

  function setAll(next: boolean) {
    setState(Object.fromEntries(CHANNELS.map((c) => [c.relay, next])));
    void operate(
      CHANNELS.map((c) => ({ action: next ? "ON" : "OFF", params: { relay: c.relay } })),
      "all",
    );
  }

  const switches = CHANNELS.filter((c) => c.kind === "switch");
  const fans = CHANNELS.filter((c) => c.kind === "fan");

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <StatusHeader
        name={device.device_name}
        productName={device.iot_products?.product_name}
        online={device.is_online ?? false}
        lastSeen={device.last_seen}
      />

      {/* Summary + master controls */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">Channels on</div>
            <div className="text-2xl font-semibold mt-0.5">
              {onCount}
              <span className="text-base text-muted"> / {CHANNELS.length}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              loading={busy === "all"}
              onClick={() => setAll(true)}
            >
              All on
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={busy === "all"}
              onClick={() => setAll(false)}
            >
              All off
            </Button>
          </div>
        </div>
      </Card>

      {/* Switch channels */}
      <Section title="Switches">
        <div className="flex flex-col gap-2">
          {switches.map((c) => (
            <ToggleTile
              key={c.relay}
              label={c.label}
              description={state[c.relay] ? "On" : "Off"}
              icon={<Lightbulb size={18} />}
              value={Boolean(state[c.relay])}
              loading={busy === `ch-${c.relay}`}
              onChange={(next) => toggle(c.relay, next)}
            />
          ))}
        </div>
      </Section>

      {/* Fan channel */}
      {fans.length > 0 ? (
        <Section title="Fan">
          <div className="flex flex-col gap-2">
            {fans.map((c) => (
              <ToggleTile
                key={c.relay}
                label={c.label}
                description={state[c.relay] ? "Running" : "Off"}
                icon={<Fan size={18} />}
                value={Boolean(state[c.relay])}
                loading={busy === `ch-${c.relay}`}
                onChange={(next) => toggle(c.relay, next)}
              />
            ))}
          </div>
          <p className="text-xs text-muted mt-1">
            Fan speed control isn't exposed by this product — on/off only.
          </p>
        </Section>
      ) : null}

      <Card>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Power size={14} />
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
