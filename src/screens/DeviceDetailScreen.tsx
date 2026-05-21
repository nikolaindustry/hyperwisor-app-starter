import { useNavigate, useParams } from "react-router-dom";
import { LayoutDashboard, Settings, Terminal } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusHeader } from "@/components/blocks/StatusHeader";
import { useDevices, useRemoveDevice } from "@/hooks/useDevices";
import { useToast } from "@/components/ui/Toast";
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

  // Bespoke, AI-generated screen for this product — or a clear empty state.
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
        {BespokeScreen ? <BespokeScreen device={device} /> : <NoDashboardView device={device} />}

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
 * Shown when a product has no bespoke screen registered. A clear empty
 * state — NOT a generic telemetry view that could be mistaken for a real
 * product UI. The dev hint tells the manufacturer how to generate one.
 */
function NoDashboardView({ device }: { device: UserDevice }) {
  return (
    <div className="p-4 flex flex-col gap-4">
      <StatusHeader
        name={device.device_name}
        productName={device.iot_products?.product_name}
        online={device.is_online ?? false}
        lastSeen={device.last_seen}
      />

      <div className="flex flex-col items-center text-center mt-10 gap-3">
        <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
          <LayoutDashboard size={36} className="text-muted" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">No dashboard yet</h2>
          <p className="text-muted text-sm mt-1 max-w-xs">
            A screen for this product hasn't been built yet.
          </p>
        </div>
      </div>

      {/* Developer hint — how to generate this product's screen. */}
      <Card className="mt-6">
        <div className="flex items-start gap-2">
          <Terminal size={15} className="text-muted mt-0.5 shrink-0" />
          <div className="text-xs text-muted">
            <span className="font-medium text-foreground">For the developer:</span>{" "}
            run{" "}
            <code className="bg-background px-1 py-0.5 rounded border border-border">
              npm run inspect {device.product_id}
            </code>{" "}
            and ask your AI agent to build this product's screen. See{" "}
            <code className="bg-background px-1 py-0.5 rounded border border-border">
              CLAUDE.md
            </code>
            .
          </div>
        </div>
      </Card>
    </div>
  );
}
