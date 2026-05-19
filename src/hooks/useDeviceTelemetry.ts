import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/sdk";
import { useAuth } from "@/auth/AuthProvider";
import type { SensorReading } from "@/lib/types";

/** Returns historical sensor data + a live-updating "latest" reading. */
export function useDeviceTelemetry(deviceId: string | undefined) {
  const { user } = useAuth();
  const [live, setLive] = React.useState<SensorReading | null>(null);

  const history = useQuery({
    queryKey: ["sensor-data", deviceId],
    queryFn: () => sdk.getSensorData(deviceId!),
    enabled: Boolean(deviceId),
    select: (r) => r.data,
  });

  React.useEffect(() => {
    if (!deviceId || !user?.id) return;
    const unsub = sdk.subscribeTelemetry(deviceId, user.id, (reading) => {
      setLive(reading);
    });
    return unsub;
  }, [deviceId, user?.id]);

  // Merge history + the latest live reading for chart display.
  const series = React.useMemo<SensorReading[]>(() => {
    const base = history.data ?? [];
    if (!live) return base;
    return [...base, live].slice(-48);
  }, [history.data, live]);

  return { history: series, live, isLoading: history.isLoading };
}
