import { useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { useDevices } from "@/hooks/useDevices";

export function DeviceSettingsScreen() {
  const { id } = useParams<{ id: string }>();
  const { data: devices } = useDevices();
  const device = devices?.find((d) => d.id === id);

  if (!device) {
    return (
      <div className="min-h-screen">
        <AppHeader title="Settings" showBack />
        <div className="p-6 text-muted">Device not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title="Settings" showBack />
      <main className="flex-1 p-4 flex flex-col gap-3">
        <Card>
          <Row label="Name" value={device.device_name} />
          <Row label="Product" value={device.iot_products?.product_name ?? "—"} />
          <Row label="Model" value={device.iot_products?.model_number ?? "—"} />
          <Row label="Firmware" value={device.iot_products?.firmware_version ?? "—"} />
          <Row label="Device ID" value={device.device_identifier ?? "—"} />
          <Row
            label="Added"
            value={new Date(device.created_at).toLocaleDateString()}
            last
          />
        </Card>
      </main>
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={
        "flex justify-between py-3 " +
        (last ? "" : "border-b border-border")
      }
    >
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium truncate ml-4">{value}</span>
    </div>
  );
}
