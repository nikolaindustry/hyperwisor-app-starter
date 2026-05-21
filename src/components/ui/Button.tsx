import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:opacity-100",
  secondary:
    "bg-card text-foreground border border-border shadow-sm hover:bg-surface",
  ghost: "bg-transparent text-foreground hover:bg-surface",
  danger: "bg-danger text-white shadow-sm hover:opacity-90 active:opacity-100",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-md gap-1.5",
  md: "h-11 px-4 text-sm rounded-md gap-2",
  lg: "h-12 px-5 text-[15px] rounded-lg gap-2",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium select-none",
        "transition-[transform,opacity,background-color] duration-150",
        "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />
      ) : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
