import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        // An input is a well you type into, so it is pressed, not raised --
        // which is also what tells it apart from a button at a glance.
        "w-full h-12 rounded-lg bg-card px-4 text-sm text-foreground border-0",
        "placeholder:text-muted/70 shadow-press transition-shadow",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
