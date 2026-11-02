import { Link } from "react-router-dom";
import { Cpu } from "lucide-react";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { UserDevice } from "@/lib/types";

/**
 * One device, as a tile.
 *
 * A list of identical rows tells you only how many devices you own. A tile has
 * room to lead with the device's state, which is what the list is for.
 *
 * An offline device is drawn RECESSED rather than greyed out. In a flat theme
 * grey text is the only way to say "not here"; with soft UI the tile itself
 * sits down, which reads as absent rather than broken.
 */
export function DeviceCard({ device }: { device: UserDevice }) {
  const online = device.is_online ?? false;

  return (
    <Link
      to={`/devices/${device.id}`}
      className={cn(
        "rounded-lg bg-card p-4 flex flex-col gap-3 transition-shadow duration-150",
        online ? "shadow-lift active:shadow-press" : "shadow-press-sm",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "w-10 h-10 rounded-md bg-card flex items-center justify-center shrink-0",
            online ? "shadow-press-sm text-primary" : "shadow-lift-sm text-muted",
          )}
        >
          <Cpu size={18} />
        </div>
        <span
          className={cn(
            "w-[7px] h-[7px] rounded-full shrink-0 mt-1",
            online ? "bg-success" : "bg-muted/60",
          )}
        />
      </div>

      <div className="min-w-0">
        <div
          className={cn(
            // Two lines, not an ellipsis: a tile is narrow and most device
            // names are two or three words, so truncating hides the word that
            // distinguishes one unit from another.
            "font-medium text-[13px] leading-snug line-clamp-2",
            online ? "text-foreground" : "text-muted",
          )}
        >
          {device.device_name}
        </div>
        <div className="text-[11.5px] text-muted truncate mt-0.5">
          {online ? "Online" : `Last seen ${formatTimeAgo(device.last_seen)}`}
        </div>
      </div>
    </Link>
  );
}
