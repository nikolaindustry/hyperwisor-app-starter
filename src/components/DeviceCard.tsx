import { Link } from "react-router-dom";
import { Wifi, WifiOff } from "lucide-react";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { UserDevice } from "@/lib/types";

export function DeviceCard({ device }: { device: UserDevice }) {
  const online = device.is_online ?? false;
  return (
    <Link
      to={`/devices/${device.id}`}
      className="rounded border border-border bg-surface p-4 flex items-center gap-3 hover:bg-border/30 transition"
    >
      <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-primary text-lg font-semibold shrink-0">
        {device.iot_products?.product_name?.charAt(0) ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{device.device_name}</div>
        <div className="text-xs text-muted truncate">
          {device.iot_products?.product_name ?? "Unknown product"}
        </div>
      </div>
      <div
        className={cn(
          "flex items-center gap-1 text-xs",
          online ? "text-success" : "text-muted",
        )}
      >
        {online ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span>{online ? "Online" : formatTimeAgo(device.last_seen)}</span>
      </div>
    </Link>
  );
}
