import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A clean on/off control tile. The workhorse control for switches,
 * relays, outlets, lights, etc.
 *
 * Pair with sdk.sendCommand inside `onChange`.
 */
export function ToggleTile({
  label,
  description,
  icon,
  value,
  loading,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  value: boolean;
  loading?: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={() => onChange(!value)}
      className={cn(
        "w-full text-left rounded border p-4 transition flex items-center gap-3 disabled:opacity-50",
        value
          ? "border-primary bg-primary/5"
          : "border-border bg-surface hover:bg-border/30",
      )}
    >
      {icon ? (
        <div
          className={cn(
            "w-10 h-10 rounded flex items-center justify-center shrink-0",
            value ? "bg-primary/15 text-primary" : "bg-border/60 text-muted",
          )}
        >
          {icon}
        </div>
      ) : null}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{label}</div>
        {description ? (
          <div className="text-xs text-muted truncate">{description}</div>
        ) : null}
      </div>
      {/* Visual switch */}
      <span
        className={cn(
          "w-11 h-6 rounded-full p-0.5 transition shrink-0",
          value ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "block w-5 h-5 rounded-full bg-white transition-transform",
            value ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}
