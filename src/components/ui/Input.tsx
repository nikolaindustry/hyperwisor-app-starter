import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-11 rounded-md border border-border bg-card px-3.5 text-sm text-foreground",
        "placeholder:text-muted/70 shadow-sm transition-colors",
        "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
