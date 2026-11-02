import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remove the default padding (for full-bleed content). */
  flush?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, flush, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Soft UI: no border. The lift IS the edge; adding a rule as well
        // reads as outlined rather than raised.
        "rounded-lg bg-card shadow-lift",
        flush ? "" : "p-4",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";
