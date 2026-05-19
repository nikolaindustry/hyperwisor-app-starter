import { useNavigate, useParams } from "react-router-dom";
import { Settings, Wifi, WifiOff } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ControlWidget } from "@/components/ControlWidget";
import { TelemetryChart } from "@/components/TelemetryChart";
import { useDevices, useRemoveDevice } from "@/hooks/useDevices";
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import { useToast } from "@/components/ui/Toast";
import { cn, formatTimeAgo } from "@/lib/utils";

export function DeviceDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: devices, isLoading } = useDevices();
  const remove = useRemoveDevice();
  const device = devices?.find((d) => d.id === id);
  const telemetry = useDeviceTelemetry(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader title="Device" showBack />
        <div className="flex-1 flex justify-center mt-12 text-muted text-sm">Loading…</div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader title="Not found" showBack />
        <div className="p-6 text-center text-muted">This device no longer exists.</div>
      </div>
    );
  }

  const online = device.is_online ?? false;
  const commands = device.iot_products?.product_commands ?? [];
  const latest = telemetry.live ?? telemetry.history[telemetry.history.length - 1];

  async function onRemove() {
    if (!confirm("Remove this device from your account?")) return;
    try {
      await remove.mutateAsync(device!.id);
      toast.push("Device removed", "success");
      navigate("/devices", { replace: true });
    } catch (err) {
      toast.push((err as Error).message || "Could not remove device", "danger");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title={device.device_name} showBack />
      <main className="flex-1 p-4 flex flex-col gap-4 pb-8">
        {/* Header card with status */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted">
                {device.iot_products?.product_name}
              </div>
              <div className="text-lg font-semibold mt-1">{device.device_name}</div>
              {device.device_identifier ? (
                <div className="text-xs text-muted mt-1">
                  ID {device.device_identifier}
                </div>
              ) : null}
            </div>
            <div
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-1 rounded",
                online
                  ? "bg-success/15 text-success"
                  : "bg-border text-muted",
              )}
            >
              {online ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{online ? "Online" : formatTimeAgo(device.last_seen)}</span>
            </div>
          </div>
        </Card>

        {/* Latest reading tile */}
        {latest ? (
          <Card className="text-center py-6">
            <div className="text-xs uppercase tracking-wide text-muted">
              {latest.sensor_name}
            </div>
            <div className="text-4xl font-semibold mt-1">
              {latest.value.toFixed(1)}
              <span className="text-base text-muted ml-1">{latest.unit ?? ""}</span>
            </div>
            <div className="text-xs text-muted mt-1">
              Updated {formatTimeAgo(latest.recorded_at)}
            </div>
          </Card>
        ) : null}

        {/* Last 24h chart */}
        <div>
          <h2 className="text-sm font-medium mb-2">Last 24 hours</h2>
          <Card>
            <TelemetryChart data={telemetry.history} />
          </Card>
        </div>

        {/* Command widgets */}
        {commands.length > 0 ? (
          <div>
            <h2 className="text-sm font-medium mb-2">Controls</h2>
            <div className="flex flex-col gap-2">
              {commands.map((cmd) => (
                <ControlWidget key={cmd.id} deviceId={device.id} command={cmd} />
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <div className="text-sm text-muted text-center py-3">
              No controls defined for this product.
            </div>
          </Card>
        )}

        {/* Settings */}
        <Card>
          <button
            className="w-full flex items-center justify-between"
            onClick={() => navigate(`/devices/${device.id}/settings`)}
          >
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-muted" />
              <span className="text-sm">Device settings</span>
            </div>
            <span className="text-muted">›</span>
          </button>
        </Card>

        <Button variant="danger" onClick={onRemove} loading={remove.isPending}>
          Remove device
        </Button>
      </main>
    </div>
  );
}
