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
        "rounded-lg border border-border bg-card shadow-sm",
        flush ? "" : "p-4",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";
