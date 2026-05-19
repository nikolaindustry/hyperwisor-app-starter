import * as React from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
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

  if (!state?.product) {
    return <Navigate to="/add" replace />;
  }

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
    <div className="min-h-screen flex flex-col">
      <AppHeader title="Name your device" showBack />
      <main className="flex-1 p-6">
        <Card className="mb-6">
          <div className="text-xs uppercase tracking-wide text-muted mb-1">Product</div>
          <div className="font-semibold">{product.product_name}</div>
          {product.model_number ? (
            <div className="text-xs text-muted mt-1">Model {product.model_number}</div>
          ) : null}
        </Card>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="text-sm font-medium">Give it a name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Living Room Thermostat"
            autoFocus
            required
          />
          <p className="text-xs text-muted">You can rename it later.</p>
          <Button type="submit" size="lg" loading={onboard.isPending} className="mt-4">
            Add device
          </Button>
        </form>
      </main>
    </div>
  );
}
