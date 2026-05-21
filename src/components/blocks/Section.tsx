import * as React from "react";

/**
 * A titled content section. The primary layout unit for device screens —
 * stack Sections vertically.
 */
export function Section({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      {title || action ? (
        <div className="flex items-center justify-between min-h-[20px] px-0.5">
          {title ? (
            <h2 className="text-[13px] font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
