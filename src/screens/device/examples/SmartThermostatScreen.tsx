/**
 * EXAMPLE device screen — Smart Thermostat.
 *
 * This is the QUALITY BAR and few-shot reference for the AI agent. It is
 * registered against the mock demo product so the starter shows a real
 * bespoke UI out of the box. When generating a screen for a real product,
 * imitate this file's structure, polish, and patterns — see CLAUDE.md.
 *
 * Patterns demonstrated:
 *  1. Receives `device: UserDevice` via DeviceScreenProps.
 *  2. Live telemetry via useDeviceTelemetry(device.id).
 *  3. Optimistic local control state + sdk.sendCommand on change.
 *  4. Composed entirely from design-system blocks (consistent + themed).
 *  5. Graceful loading / empty states.
 */

import * as React from "react";
import { Flame, Power, Snowflake, Thermometer, Wind } from "lucide-react";
import type { DeviceScreenProps } from "../types";
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import { sdk } from "@/lib/sdk";
import { useToast } from "@/components/ui/Toast";
import {
  Section,
  StatusHeader,
  MetricTile,
  MetricGrid,
  ToggleTile,
  StepperControl,
  Button,
  Card,
  TelemetryChart,
} from "@/components/blocks";

type Mode = "heat" | "cool" | "auto";

const MODES: { id: Mode; label: string; icon: React.ReactNode }[] = [
  { id: "heat", label: "Heat", icon: <Flame size={16} /> },
  { id: "cool", label: "Cool", icon: <Snowflake size={16} /> },
  { id: "auto", label: "Auto", icon: <Wind size={16} /> },
];

export function SmartThermostatScreen({ device }: DeviceScreenProps) {
  const toast = useToast();
  const telemetry = useDeviceTelemetry(device.id);

  // Optimistic control state. In a real product, seed these from the
  // device's reported state once the platform exposes it.
  const [power, setPower] = React.useState(true);
  const [target, setTarget] = React.useState(22);
  const [mode, setMode] = React.useState<Mode>("auto");
  const [busy, setBusy] = React.useState<string | null>(null);

  const current =
    telemetry.live?.value ??
    telemetry.history[telemetry.history.length - 1]?.value;

  /** Send a command, with optimistic update + rollback-free error toast. */
  async function send(
    key: string,
    commands: Parameters<typeof sdk.sendCommand>[1],
    apply: () => void,
  ) {
    setBusy(key);
    apply(); // optimistic
    try {
      await sdk.sendCommand(device.id, commands);
    } catch (err) {
      toast.push((err as Error).message || "Command failed", "danger");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <StatusHeader
        name={device.device_name}
        productName={device.iot_products?.product_name}
        online={device.is_online ?? false}
        lastSeen={device.last_seen}
      />

      {/* Hero — current temperature */}
      <MetricTile
        size="hero"
        label="Current temperature"
        icon={<Thermometer size={13} />}
        tone={power ? "primary" : "default"}
        value={current !== undefined ? current.toFixed(1) : "—"}
        unit="°C"
        hint={power ? `Target ${target}°C · ${mode}` : "Thermostat is off"}
      />

      {/* Power */}
      <ToggleTile
        label="Power"
        description={power ? "Thermostat is running" : "Thermostat is off"}
        icon={<Power size={18} />}
        value={power}
        loading={busy === "power"}
        onChange={(next) =>
          send(
            "power",
            [
              {
                command: "setPower",
                actions: [{ action: next ? "turnOn" : "turnOff" }],
              },
            ],
            () => setPower(next),
          )
        }
      />

      {/* Target temperature */}
      <Section title="Target temperature">
        <StepperControl
          value={target}
          unit="°C"
          min={10}
          max={30}
          step={1}
          loading={busy === "target"}
          onChange={(next) =>
            send(
              "target",
              [
                {
                  command: "setTemperature",
                  actions: [{ action: "set", params: { celsius: next } }],
                },
              ],
              () => setTarget(next),
            )
          }
        />
      </Section>

      {/* Mode */}
      <Section title="Mode">
        <Card>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <Button
                key={m.id}
                variant={mode === m.id ? "primary" : "secondary"}
                loading={busy === "mode" && mode === m.id}
                onClick={() =>
                  send(
                    "mode",
                    [
                      {
                        command: "setMode",
                        actions: [{ action: "set", params: { mode: m.id } }],
                      },
                    ],
                    () => setMode(m.id),
                  )
                }
              >
                {m.icon}
                {m.label}
              </Button>
            ))}
          </div>
        </Card>
      </Section>

      {/* History */}
      <Section title="Last 24 hours">
        <Card>
          {telemetry.isLoading ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted">
              Loading…
            </div>
          ) : (
            <TelemetryChart data={telemetry.history} />
          )}
        </Card>
      </Section>

      {/* Quick stats */}
      <Section title="Today">
        <MetricGrid>
          <MetricTile label="High" value="24.1" unit="°C" tone="danger" />
          <MetricTile label="Low" value="19.3" unit="°C" tone="primary" />
        </MetricGrid>
      </Section>
    </div>
  );
}
