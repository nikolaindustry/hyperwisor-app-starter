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
        "w-full text-left rounded-lg border shadow-sm p-3.5 flex items-center gap-3",
        "transition-[background-color,border-color,transform] duration-150 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:opacity-50 disabled:pointer-events-none",
        value
          ? "border-primary/40 bg-primary/[0.06]"
          : "border-border bg-card hover:bg-surface",
      )}
    >
      {icon ? (
        <div
          className={cn(
            "w-10 h-10 rounded-md flex items-center justify-center shrink-0 transition-colors",
            value ? "bg-primary text-primary-foreground" : "bg-surface text-muted",
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
          "relative w-[42px] h-[26px] rounded-full p-[3px] shrink-0 transition-colors duration-200",
          value ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "block w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            value ? "translate-x-4" : "translate-x-0",
            loading && "animate-pulse",
          )}
        />
      </span>
    </button>
  );
}
