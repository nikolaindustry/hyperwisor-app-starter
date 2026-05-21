import * as React from "react";
import { Cpu } from "lucide-react";
import { cn, formatTimeAgo } from "@/lib/utils";

/**
 * Device hero header — shows what the device is and whether it's live.
 * Use once at the top of a device screen.
 */
export function StatusHeader({
  name,
  productName,
  online,
  lastSeen,
  icon,
}: {
  name: string;
  productName?: string;
  online: boolean;
  lastSeen?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm p-4 flex items-center gap-3.5">
      <div
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
          online ? "bg-primary/10 text-primary" : "bg-surface text-muted",
        )}
      >
        {icon ?? <Cpu size={22} />}
      </div>

      <div className="flex-1 min-w-0">
        {productName ? (
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted truncate">
            {productName}
          </div>
        ) : null}
        <div className="text-[17px] font-semibold leading-tight truncate">
          {name}
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full shrink-0",
          online
            ? "bg-success/10 text-success"
            : "bg-surface text-muted",
        )}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            online ? "bg-success animate-pulse" : "bg-muted",
          )}
        />
        <span>{online ? "Online" : formatTimeAgo(lastSeen)}</span>
      </div>
    </div>
  );
}
