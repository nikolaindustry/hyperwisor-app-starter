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
      <div className="rounded border border-border bg-surface p-6 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide text-muted">
          {icon}
          <span>{label}</span>
        </div>
        <div className={cn("text-4xl font-semibold mt-1", toneText[tone])}>
          {value}
          {unit ? <span className="text-base text-muted ml-1">{unit}</span> : null}
        </div>
        {hint ? <div className="text-xs text-muted mt-1">{hint}</div> : null}
      </div>
    );
  }
  return (
    <div className="rounded border border-border bg-surface p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={cn("text-xl font-semibold mt-1", toneText[tone])}>
        {value}
        {unit ? <span className="text-sm text-muted ml-0.5">{unit}</span> : null}
      </div>
      {hint ? <div className="text-xs text-muted mt-0.5">{hint}</div> : null}
    </div>
  );
}

/** Responsive grid wrapper for MetricTile (size="md"). */
export function MetricGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}
