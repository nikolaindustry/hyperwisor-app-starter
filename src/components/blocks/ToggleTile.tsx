import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A clean on/off control tile. The workhorse control for switches,
 * relays, outlets, lights, etc. Pair with sdk.sendCommand in `onChange`.
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
        "w-full text-left rounded-lg bg-card p-4 flex items-center gap-3.5",
        "transition-shadow duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:opacity-50 disabled:pointer-events-none",
        // On goes INSET. In a flat theme a tint is the only way to show a
        // selected state; here the tile itself sits down, which reads as "this
        // one is engaged" without colouring half the list.
        value ? "shadow-press" : "shadow-lift active:shadow-press",
      )}
    >
      {icon ? (
        <div
          className={cn(
            "w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-colors",
            value
              ? "bg-primary text-primary-foreground shadow-lift-sm"
              : "bg-card text-muted shadow-press-sm",
          )}
        >
          {icon}
        </div>
      ) : null}

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{label}</div>
        {description ? (
          <div className="text-xs text-muted truncate mt-0.5">{description}</div>
        ) : null}
      </div>

      {/* Switch track */}
      <span
        className={cn(
          // The track is a groove, always. Only the knob changes colour, so
          // the control looks machined rather than painted.
          "relative w-[46px] h-[28px] rounded-full p-[3px] shrink-0 bg-card shadow-press-sm",
        )}
      >
        <span
          className={cn(
            "block w-[22px] h-[22px] rounded-full shadow-lift-sm transition-transform duration-200",
            value ? "translate-x-[18px] bg-primary" : "translate-x-0 bg-card",
            loading && "animate-pulse",
          )}
        />
      </span>
    </button>
  );
}
