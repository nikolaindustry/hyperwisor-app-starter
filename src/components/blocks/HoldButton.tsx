import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A momentary press-and-hold control.
 *
 * Fires `onPress` when the user presses down and `onRelease` when they
 * let go — the device is active only while held. The right control for
 * dashboard `button` widgets (horn, starter, jog, deadman switch).
 */
export function HoldButton({
  label,
  description,
  icon,
  loading,
  disabled,
  onPress,
  onRelease,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  onRelease: () => void;
}) {
  const [held, setHeld] = React.useState(false);

  const press = () => {
    if (disabled || loading) return;
    setHeld(true);
    onPress();
  };
  const release = () => {
    if (!held) return;
    setHeld(false);
    onRelease();
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      className={cn(
        "w-full text-left rounded-lg border shadow-sm p-3.5 flex items-center gap-3",
        "transition-[background-color,border-color,transform] duration-100 select-none touch-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:opacity-50 disabled:pointer-events-none",
        held
          ? "border-primary bg-primary/10 scale-[0.985]"
          : "border-border bg-card hover:bg-surface",
      )}
    >
      {icon ? (
        <div
          className={cn(
            "w-10 h-10 rounded-md flex items-center justify-center shrink-0 transition-colors",
            held ? "bg-primary text-primary-foreground" : "bg-surface text-muted",
          )}
        >
          {icon}
        </div>
      ) : null}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{label}</div>
        <div
          className={cn(
            "text-xs truncate mt-0.5",
            held ? "text-primary font-medium" : "text-muted",
          )}
        >
          {held ? "Active — release to stop" : description ?? "Press and hold"}
        </div>
      </div>
    </button>
  );
}
