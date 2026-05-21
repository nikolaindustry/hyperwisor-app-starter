import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, LayoutDashboard, Settings, Terminal, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
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
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader title="Device" showBack />
        <div className="p-4 flex flex-col gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader title="Not found" showBack />
        <div className="p-8 text-center text-muted text-sm">
          This device no longer exists.
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader title={device.device_name} showBack />
      <main className="flex-1">
        {BespokeScreen ? (
          <BespokeScreen device={device} />
        ) : (
          <NoDashboardView device={device} />
        )}

        {/* App-level footer — always present */}
        <div className="p-4 flex flex-col gap-2.5 pb-8">
          <button
            onClick={() => navigate(`/devices/${device.id}/settings`)}
            className="rounded-lg border border-border bg-card shadow-sm p-3.5 flex items-center gap-3 hover:bg-surface transition-colors"
          >
            <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center text-muted">
              <Settings size={17} />
            </div>
            <span className="flex-1 text-left text-sm font-medium">
              Device settings
            </span>
            <ChevronRight size={18} className="text-muted/60" />
          </button>
          <Button variant="ghost" onClick={onRemove} loading={remove.isPending} className="text-danger">
            <Trash2 size={16} />
            Remove device
          </Button>
        </div>
      </main>
    </div>
  );
}

/**
 * Shown when a product has no bespoke screen registered — a clear empty
 * state, not a generic telemetry view that could pass for a real UI.
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

      <div className="flex flex-col items-center text-center mt-8 gap-3">
        <div className="w-[72px] h-[72px] rounded-2xl bg-surface flex items-center justify-center">
          <LayoutDashboard size={32} className="text-muted" />
        </div>
        <div className="space-y-1">
          <h2 className="font-semibold text-lg">No dashboard yet</h2>
          <p className="text-muted text-sm max-w-[16rem]">
            A screen for this product hasn't been built yet.
          </p>
        </div>
      </div>

      {/* Developer hint */}
      <div className="mt-4 rounded-lg border border-border bg-surface/60 p-3.5 flex items-start gap-2.5">
        <Terminal size={15} className="text-muted mt-0.5 shrink-0" />
        <div className="text-xs text-muted leading-relaxed">
          <span className="font-medium text-foreground">For the developer:</span>{" "}
          run{" "}
          <code className="bg-card px-1.5 py-0.5 rounded border border-border text-[11px]">
            npm run inspect {device.product_id}
          </code>{" "}
          and ask your AI agent to build this product's screen — see{" "}
          <code className="bg-card px-1.5 py-0.5 rounded border border-border text-[11px]">
            CLAUDE.md
          </code>
          .
        </div>
      </div>
    </div>
  );
}
