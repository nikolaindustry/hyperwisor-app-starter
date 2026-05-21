import { Wifi, WifiOff } from "lucide-react";
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
}: {
  name: string;
  productName?: string;
  online: boolean;
  lastSeen?: string | null;
}) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {productName ? (
            <div className="text-xs uppercase tracking-wide text-muted">
              {productName}
            </div>
          ) : null}
          <div className="text-lg font-semibold mt-0.5 truncate">{name}</div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-xs px-2 py-1 rounded shrink-0",
            online ? "bg-success/15 text-success" : "bg-border text-muted",
          )}
        >
          {online ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{online ? "Online" : formatTimeAgo(lastSeen)}</span>
        </div>
      </div>
    </div>
  );
}
