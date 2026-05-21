import { Link } from "react-router-dom";
import { ChevronRight, Cpu } from "lucide-react";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { UserDevice } from "@/lib/types";

export function DeviceCard({ device }: { device: UserDevice }) {
  const online = device.is_online ?? false;
  return (
    <Link
      to={`/devices/${device.id}`}
      className={cn(
        "group rounded-lg border border-border bg-card shadow-sm p-3.5",
        "flex items-center gap-3 transition-colors hover:bg-surface",
        "active:scale-[0.99]",
      )}
    >
      <div
        className={cn(
          "w-11 h-11 rounded-lg flex items-center justify-center shrink-0",
          online ? "bg-primary/10 text-primary" : "bg-surface text-muted",
        )}
      >
        <Cpu size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-[15px] truncate">
          {device.device_name}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              online ? "bg-success" : "bg-muted/50",
            )}
          />
          <span className="text-xs text-muted truncate">
            {online ? "Online" : `Last seen ${formatTimeAgo(device.last_seen)}`}
          </span>
        </div>
      </div>

      <ChevronRight
        size={18}
        className="text-muted/60 shrink-0 group-hover:text-muted transition-colors"
      />
    </Link>
  );
}
