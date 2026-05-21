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
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader title="Settings" showBack />
        <div className="p-8 text-center text-muted text-sm">Device not found.</div>
      </div>
    );
  }

  const rows: [string, string][] = [
    ["Name", device.device_name],
    ["Product", device.iot_products?.product_name ?? "—"],
    ["Model", device.iot_products?.model_number ?? "—"],
    ["Firmware", device.iot_products?.firmware_version ?? "—"],
    ["Device ID", device.device_identifier ?? "—"],
    ["Added", new Date(device.created_at).toLocaleDateString()],
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader title="Device settings" showBack />
      <div className="flex-1 p-4">
        <Card flush>
          {rows.map(([label, value], i) => (
            <div
              key={label}
              className={
                "flex items-center justify-between gap-4 px-4 py-3.5 " +
                (i < rows.length - 1 ? "border-b border-border" : "")
              }
            >
              <span className="text-sm text-muted shrink-0">{label}</span>
              <span className="text-sm font-medium text-right truncate">
                {value}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
