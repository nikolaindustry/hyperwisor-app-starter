import * as React from "react";
import { sdk } from "@/lib/sdk";
import { useAuth } from "@/auth/AuthProvider";
import type { SensorReading } from "@/lib/types";

/**
 * Multi-sensor telemetry for the Smart Bike.
 *
 * The bike reports several sensors (temperature, humidity) on the same
 * realtime channel. This hook keeps the latest reading for each, keyed
 * by `sensor_name`.
 *
 * NOTE: the keys below must match the `sensor_name` your bike firmware
 * sends in its WebSocket frames. They're taken from the product's
 * dashboard labels — confirm with the manufacturer if live values
 * don't appear.
 */
export const BIKE_SENSORS = {
  tempC: "TempC",
  tempF: "TempF",
  humidity: "Humidity",
} as const;

export function useBikeTelemetry(deviceId: string) {
  const { user } = useAuth();
  const [sensors, setSensors] = React.useState<Record<string, SensorReading>>({});
  const [lastUpdate, setLastUpdate] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!deviceId || !user?.id) return;
    return sdk.subscribeTelemetry(deviceId, user.id, (reading) => {
      setSensors((prev) => ({ ...prev, [reading.sensor_name]: reading }));
      setLastUpdate(reading.recorded_at);
    });
  }, [deviceId, user?.id]);

  return { sensors, lastUpdate };
}
