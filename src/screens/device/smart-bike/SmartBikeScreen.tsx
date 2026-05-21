/**
 * Bespoke device screen — Smart Bike Controller.
 *
 * Generated for product "Smart Bike" (2935cd69-302d-42f0-8708-3bd909ffc647).
 *
 * Built from `capabilities.controls` in the inspected spec — i.e. the
 * manufacturer's actual dashboard, not just the raw command list:
 *   - "power"      → switch  → Relay_1 ON/OFF        (latching)
 *   - "New button" → button  → Relay_2 ON/OFF        (momentary)
 *   - displays: TempC, TempF, Humidity
 *
 * Notes for the manufacturer:
 *   - The firmware also exposes Relay 3 & 4 (command "Operate"), but your
 *     dashboard doesn't use them — add controls below if you want them.
 *   - "New button" is the dashboard's default title — rename it to the real
 *     function (horn, starter, …).
 *   - Your dashboard has a payment-action that unlocks Relay 1 on payment.
 *     The starter has no payment layer; wire one in if you need paid unlock.
 */

import * as React from "react";
import { Bike, Droplets, Power, RefreshCw, Thermometer, Zap } from "lucide-react";
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
  Button,
  Card,
} from "@/components/blocks";
import { useBikeTelemetry, BIKE_SENSORS } from "./useBikeTelemetry";

export function SmartBikeScreen({ device }: DeviceScreenProps) {
  const toast = useToast();
  const { sensors, lastUpdate } = useBikeTelemetry(device.id);

  const [power, setPower] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [unit, setUnit] = React.useState<"C" | "F">("C");

  const tempC = sensors[BIKE_SENSORS.tempC]?.value;
  const tempF = sensors[BIKE_SENSORS.tempF]?.value;
  const humidity = sensors[BIKE_SENSORS.humidity]?.value;
  const temp = unit === "C" ? tempC : tempF;

  /** Fire the "Operate" command for a relay. */
  async function operate(action: string, key: string) {
    setBusy(key);
    try {
      await sdk.sendCommand(device.id, [
        { command: "Operate", actions: [{ action }] },
      ]);
    } catch (err) {
      toast.push((err as Error).message || "Command failed", "danger");
    } finally {
      setBusy(null);
    }
  }

  /** "power" — latching switch → Relay 1. */
  function togglePower(next: boolean) {
    setPower(next); // optimistic
    void operate(next ? "Relay_1_ON" : "Relay_1_OFF", "power");
  }

  async function readSensors() {
    setBusy("read");
    try {
      await sdk.sendCommand(device.id, [
        { command: "read_data", actions: [{ action: "get_Temperature_Humidity" }] },
      ]);
      toast.push("Requested a sensor reading", "info");
    } catch (err) {
      toast.push((err as Error).message || "Could not read sensors", "danger");
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

      {/* Temperature hero */}
      <MetricTile
        size="hero"
        label="Temperature"
        icon={<Thermometer size={13} />}
        tone={power ? "primary" : "default"}
        value={temp !== undefined ? temp.toFixed(1) : "—"}
        unit={`°${unit}`}
        hint={
          lastUpdate
            ? `Updated ${new Date(lastUpdate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Tap Read sensors to update"
        }
      />

      <Section
        title="Climate"
        action={
          <button
            onClick={() => setUnit((u) => (u === "C" ? "F" : "C"))}
            className="text-xs text-primary font-medium"
          >
            Show °{unit === "C" ? "F" : "C"}
          </button>
        }
      >
        <MetricGrid>
          <MetricTile
            label="Humidity"
            icon={<Droplets size={13} />}
            value={humidity !== undefined ? humidity.toFixed(0) : "—"}
            unit="%"
          />
          <MetricTile
            label={unit === "C" ? "Also in °F" : "Also in °C"}
            icon={<Thermometer size={13} />}
            value={
              unit === "C"
                ? tempF !== undefined ? tempF.toFixed(1) : "—"
                : tempC !== undefined ? tempC.toFixed(1) : "—"
            }
            unit={unit === "C" ? "°F" : "°C"}
          />
        </MetricGrid>
        <Button
          variant="secondary"
          loading={busy === "read"}
          onClick={readSensors}
          className="mt-2 w-full"
        >
          <RefreshCw size={16} />
          Read sensors
        </Button>
      </Section>

      {/* Controls — exactly what the manufacturer's dashboard surfaces */}
      <Section title="Controls">
        <div className="flex flex-col gap-2">
          {/* "power" — latching switch (Relay 1) */}
          <ToggleTile
            label="Power"
            description={power ? "Bike is powered on" : "Bike is off"}
            icon={<Power size={18} />}
            value={power}
            loading={busy === "power"}
            onChange={togglePower}
          />

          {/* "New button" — momentary press (Relay 2) */}
          <HoldButton
            label="New button"
            description="Press and hold"
            icon={<Zap size={18} />}
            loading={busy === "button"}
            onPress={() => operate("Relay_2_ON", "button")}
            onRelease={() => operate("Relay_2_OFF", "button")}
          />
        </div>
      </Section>

      <Card>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Bike size={14} />
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
