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
        "w-full text-left rounded border p-4 flex items-center gap-3 transition select-none touch-none disabled:opacity-50",
        held
          ? "border-primary bg-primary/10 scale-[0.99]"
          : "border-border bg-surface hover:bg-border/30",
      )}
    >
      {icon ? (
        <div
          className={cn(
            "w-10 h-10 rounded flex items-center justify-center shrink-0 transition",
            held ? "bg-primary text-primary-foreground" : "bg-border/60 text-muted",
          )}
        >
          {icon}
        </div>
      ) : null}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{label}</div>
        <div className="text-xs text-muted truncate">
          {held ? "Active — release to stop" : description ?? "Press and hold"}
        </div>
      </div>
    </button>
  );
}
