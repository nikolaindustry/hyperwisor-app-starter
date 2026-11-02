import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

/**
 * Soft UI variants.
 *
 * `primary` keeps a solid fill rather than becoming another ground-coloured
 * slab: a neumorphic primary has no visual priority, and on the setup screens
 * the one action you must tap would disappear into the page.
 *
 * Everything raised goes INSET when pressed. That inversion is the whole
 * point of the style -- the surface actually moves under your finger.
 */
const variantStyles: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-lift hover:brightness-[1.04] active:shadow-press",
  secondary:
    "bg-card text-foreground shadow-lift hover:brightness-[1.01] active:shadow-press",
  ghost: "bg-transparent text-foreground active:shadow-press-sm",
  danger: "bg-danger text-white shadow-lift hover:brightness-110 active:shadow-press",
};

// Radii run one step larger than a flat theme. Soft corners are what make the
// paired shadows read as a bevel instead of a drop shadow.
const sizeStyles: Record<Size, string> = {
  sm: "h-10 px-4 text-[13px] rounded-md gap-1.5",
  md: "h-12 px-5 text-sm rounded-lg gap-2",
  lg: "h-[52px] px-6 text-[15px] rounded-xl gap-2",
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
        "transition-[box-shadow,filter] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
