import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A +/- stepper for numeric setpoints (target temperature, brightness,
 * fan speed, etc). Commits on each step — wire `onChange` to sdk.sendCommand.
 */
export function StepperControl({
  label,
  value,
  unit,
  min = 0,
  max = 100,
  step = 1,
  loading,
  onChange,
}: {
  label?: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  loading?: boolean;
  onChange: (next: number) => void;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="rounded border border-border bg-surface p-4">
      {label ? <div className="text-sm font-medium mb-3">{label}</div> : null}
      <div className="flex items-center justify-between">
        <StepBtn
          ariaLabel="Decrease"
          disabled={loading || value <= min}
          onClick={() => onChange(clamp(value - step))}
        >
          <Minus size={20} />
        </StepBtn>
        <div className="text-3xl font-semibold tabular-nums">
          {value}
          {unit ? <span className="text-base text-muted ml-1">{unit}</span> : null}
        </div>
        <StepBtn
          ariaLabel="Increase"
          disabled={loading || value >= max}
          onClick={() => onChange(clamp(value + step))}
        >
          <Plus size={20} />
        </StepBtn>
      </div>
    </div>
  );
}

function StepBtn({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-12 h-12 rounded-full border border-border flex items-center justify-center transition",
        "hover:bg-border/40 active:scale-95 disabled:opacity-40",
      )}
    >
      {children}
    </button>
  );
}
