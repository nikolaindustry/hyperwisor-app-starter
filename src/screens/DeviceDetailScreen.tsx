import { useNavigate, useParams } from "react-router-dom";
import { Settings } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ControlWidget } from "@/components/ControlWidget";
import { TelemetryChart } from "@/components/TelemetryChart";
import { StatusHeader } from "@/components/blocks/StatusHeader";
import { MetricTile } from "@/components/blocks/MetricTile";
import { useDevices, useRemoveDevice } from "@/hooks/useDevices";
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import { useToast } from "@/components/ui/Toast";
import { formatTimeAgo } from "@/lib/utils";
import { getDeviceScreen } from "@/screens/device/productScreenRegistry";
import type { UserDevice } from "@/lib/types";

export function DeviceDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: devices, isLoading } = useDevices();
  const remove = useRemoveDevice();
  const device = devices?.find((d) => d.id === id);

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

  // Bespoke, AI-generated screen for this product — or the generic fallback.
  const BespokeScreen = getDeviceScreen(device.product_id);

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
      <main className="flex-1">
        {BespokeScreen ? <BespokeScreen device={device} /> : <GenericDeviceView device={device} />}

        {/* App-level footer — always present regardless of screen type */}
        <div className="p-4 flex flex-col gap-3 pb-8">
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
        </div>
      </main>
    </div>
  );
}

/**
 * Generic fallback shown when a product has no bespoke screen yet.
 * Renders telemetry + the product's declared commands as plain controls.
 * Run `npm run inspect <productId>` then ask the AI agent to replace this.
 */
function GenericDeviceView({ device }: { device: UserDevice }) {
  const telemetry = useDeviceTelemetry(device.id);
  const commands = device.iot_products?.product_commands ?? [];
  const latest = telemetry.live ?? telemetry.history[telemetry.history.length - 1];

  return (
    <div className="p-4 flex flex-col gap-4">
      <StatusHeader
        name={device.device_name}
        productName={device.iot_products?.product_name}
        online={device.is_online ?? false}
        lastSeen={device.last_seen}
      />

      {latest ? (
        <MetricTile
          size="hero"
          label={latest.sensor_name}
          value={latest.value.toFixed(1)}
          unit={latest.unit ?? ""}
          hint={`Updated ${formatTimeAgo(latest.recorded_at)}`}
        />
      ) : null}

      <div>
        <h2 className="text-sm font-medium mb-2">Last 24 hours</h2>
        <Card>
          <TelemetryChart data={telemetry.history} />
        </Card>
      </div>

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
            No bespoke screen for this product yet. Run{" "}
            <code>npm run inspect {device.product_id}</code> and ask your AI
            agent to build one.
          </div>
        </Card>
      )}
    </div>
  );
}
