import { Link } from "react-router-dom";
import { Activity, Cpu } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDevices } from "@/hooks/useDevices";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { UserDevice } from "@/lib/types";

/**
 * Activity tab — a recent-status overview of the user's devices, newest
 * first. (No fabricated event log — it reflects real device state.)
 */
export function ActivityScreen() {
  const { data: devices, isLoading } = useDevices();

  const sorted = [...(devices ?? [])].sort((a, b) => {
    if ((b.is_online ? 1 : 0) !== (a.is_online ? 1 : 0)) {
      return (b.is_online ? 1 : 0) - (a.is_online ? 1 : 0);
    }
    const at = new Date(a.last_seen ?? a.created_at).getTime();
    const bt = new Date(b.last_seen ?? b.created_at).getTime();
    return bt - at;
  });

  return (
    <div className="flex flex-col">
      <AppHeader title="Activity" subtitle="Recent device status" />
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[68px] w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyActivity />
        ) : (
          <div className="flex flex-col gap-2.5">
            {sorted.map((d) => (
              <ActivityRow key={d.id} device={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityRow({ device }: { device: UserDevice }) {
  const online = device.is_online ?? false;
  return (
    <Link
      to={`/devices/${device.id}`}
      className="rounded-lg border border-border bg-card shadow-sm p-3.5 flex items-center gap-3 hover:bg-surface transition-colors"
    >
      <div
        className={cn(
          "w-10 h-10 rounded-md flex items-center justify-center shrink-0",
          online ? "bg-success/10 text-success" : "bg-surface text-muted",
        )}
      >
        <Cpu size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{device.device_name}</div>
        <div className="text-xs text-muted truncate">
          {online ? "Online now" : `Last seen ${formatTimeAgo(device.last_seen)}`}
          {" · "}
          {device.iot_products?.product_name ?? "Device"}
        </div>
      </div>
      <span className="text-[11px] text-muted shrink-0">
        {formatTimeAgo(device.last_seen ?? device.created_at)}
      </span>
    </Link>
  );
}

function EmptyActivity() {
  return (
    <div className="flex flex-col items-center text-center mt-24 gap-3">
      <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
        <Activity size={30} className="text-muted" />
      </div>
      <div>
        <h2 className="font-semibold">No activity yet</h2>
        <p className="text-muted text-sm mt-1 max-w-xs">
          Add a device and its status will show up here.
        </p>
      </div>
    </div>
  );
}
