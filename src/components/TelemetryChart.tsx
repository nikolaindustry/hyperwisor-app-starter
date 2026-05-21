import {
  Area,
  AreaChart,
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
    <div className="h-44 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="telemetryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tick={{ fontSize: 10, fill: "var(--color-muted)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-muted)" }}
            axisLine={false}
            tickLine={false}
            width={32}
            domain={["dataMin - 1", "dataMax + 1"]}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-border)" }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid var(--color-border)",
              background: "var(--color-card)",
              color: "var(--color-text)",
              fontSize: 12,
              boxShadow: "var(--shadow-md)",
            }}
            labelStyle={{ color: "var(--color-muted)" }}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke="var(--color-primary)"
            strokeWidth={2.25}
            fill="url(#telemetryFill)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
