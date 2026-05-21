import * as React from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Cpu } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useOnboardDevice } from "@/hooks/useDevices";
import type { Product, QrCodeData } from "@/lib/types";

type RouteState = { product: Product; qrInfo: QrCodeData };

export function NameDeviceScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const state = location.state as RouteState | null;
  const onboard = useOnboardDevice();
  const [name, setName] = React.useState(state?.product?.product_name ?? "");

  if (!state?.product) return <Navigate to="/add" replace />;
  const { product, qrInfo } = state;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await onboard.mutateAsync({
        product_id: product.id,
        device_name: name.trim(),
        device_identifier: qrInfo?.deviceId,
      });
      toast.push("Device added", "success");
      navigate(`/devices/${res.device.id}`, { replace: true });
    } catch (err) {
      toast.push((err as Error).message || "Could not add device", "danger");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader title="Name your device" showBack />
      <div className="flex-1 p-4 flex flex-col">
        {/* Product preview */}
        <div className="rounded-lg border border-border bg-card shadow-sm p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Cpu size={22} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Product
            </div>
            <div className="font-semibold truncate">{product.product_name}</div>
            {product.model_number ? (
              <div className="text-xs text-muted">Model {product.model_number}</div>
            ) : null}
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-6">
          <Field label="Device name" hint="You can rename it later.">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Living Room Thermostat"
              autoFocus
              required
            />
          </Field>
          <Button
            type="submit"
            size="lg"
            loading={onboard.isPending}
            className="mt-1"
          >
            Add device
          </Button>
        </form>
      </div>
    </div>
  );
}
