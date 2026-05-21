import * as React from "react";

/**
 * A titled content section. The primary layout unit for generated
 * device screens — stack Sections vertically.
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
    <section className="flex flex-col gap-2">
      {title || action ? (
        <div className="flex items-center justify-between">
          {title ? (
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          ) : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
