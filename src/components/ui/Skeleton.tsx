import { cn } from "@/lib/utils";

/**
 * Loading placeholder with a subtle shimmer. Use to fill space while
 * data loads instead of a bare spinner.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-surface",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer",
        "after:bg-gradient-to-r after:from-transparent after:via-black/5 after:to-transparent",
        className,
      )}
    />
  );
}
