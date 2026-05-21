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
    <div className="rounded-lg border border-border bg-card shadow-sm p-4">
      {label ? (
        <div className="text-sm font-medium mb-3.5">{label}</div>
      ) : null}
      <div className="flex items-center justify-between">
        <StepBtn
          ariaLabel="Decrease"
          disabled={loading || value <= min}
          onClick={() => onChange(clamp(value - step))}
        >
          <Minus size={20} />
        </StepBtn>
        <div className="text-[40px] leading-none font-semibold tracking-tight tabular-nums">
          {value}
          {unit ? (
            <span className="text-lg text-muted ml-1 font-medium">{unit}</span>
          ) : null}
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
        "w-12 h-12 rounded-full border border-border bg-card flex items-center justify-center",
        "transition-[transform,background-color] duration-150 active:scale-90",
        "hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:opacity-35 disabled:pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}
