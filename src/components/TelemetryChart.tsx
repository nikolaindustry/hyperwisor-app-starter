import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SensorReading } from "@/lib/types";

export function TelemetryChart({ data }: { data: SensorReading[] }) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted">
        No data yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    t: new Date(d.recorded_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    v: Number(d.value.toFixed(2)),
  }));

  return (
    <div className="h-48 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <XAxis dataKey="t" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} width={32} domain={["dataMin - 1", "dataMax + 1"]} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-background)",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="v"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
