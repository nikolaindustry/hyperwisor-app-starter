import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "success" | "danger";

const toneText: Record<Tone, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  danger: "text-danger",
};

/**
 * A single telemetry / stat tile.
 *
 * - `size="hero"` → big centered primary reading (one per screen).
 * - `size="md"`   → grid tile for secondary metrics.
 */
export function MetricTile({
  label,
  value,
  unit,
  icon,
  tone = "default",
  size = "md",
  hint,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  size?: "md" | "hero";
  hint?: string;
}) {
  if (size === "hero") {
    return (
      <div className="rounded-lg border border-border bg-card shadow-sm px-6 py-7 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          {icon}
          <span>{label}</span>
        </div>
        <div
          className={cn(
            "mt-2 text-5xl font-semibold tracking-tight tabular-nums",
            toneText[tone],
          )}
        >
          {value}
          {unit ? (
            <span className="text-xl text-muted ml-1 font-medium">{unit}</span>
          ) : null}
        </div>
        {hint ? (
          <div className="text-xs text-muted mt-2">{hint}</div>
        ) : null}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm p-3.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          "mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums",
          toneText[tone],
        )}
      >
        {value}
        {unit ? (
          <span className="text-sm text-muted ml-0.5 font-medium">{unit}</span>
        ) : null}
      </div>
      {hint ? <div className="text-[11px] text-muted mt-0.5">{hint}</div> : null}
    </div>
  );
}

/** Responsive grid wrapper for MetricTile (size="md"). */
export function MetricGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.5">{children}</div>;
}
