import { Link } from "react-router-dom";
import { Plus, PackageOpen } from "lucide-react";
import { useDevices } from "@/hooks/useDevices";
import { DeviceCard } from "@/components/DeviceCard";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { appConfig } from "@config";

export function DeviceListScreen() {
  const { data: devices, isLoading } = useDevices();

  // multi-product mode groups by product family
  const grouped = (devices ?? []).reduce<Record<string, typeof devices>>(
    (acc, d) => {
      if (!d) return acc;
      const key = d.iot_products?.product_name ?? "Other";
      (acc[key] ||= []).push(d);
      return acc;
    },
    {},
  );

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title="My Devices" />
      <main className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center mt-12 text-muted text-sm">Loading…</div>
        ) : !devices || devices.length === 0 ? (
          <EmptyState />
        ) : appConfig.mode === "multi-product" ? (
          <div className="flex flex-col gap-6">
            {Object.entries(grouped).map(([family, list]) => (
              <section key={family}>
                <h2 className="text-xs uppercase tracking-wide text-muted mb-2">{family}</h2>
                <div className="flex flex-col gap-2">
                  {list!.map((d) => (
                    <DeviceCard key={d.id} device={d} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {devices.map((d) => (
              <DeviceCard key={d.id} device={d} />
            ))}
          </div>
        )}
      </main>
      <Link
        to="/add"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
        aria-label="Add device"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center mt-20 gap-4">
      <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
        <PackageOpen size={40} className="text-muted" />
      </div>
      <div>
        <h2 className="font-semibold text-lg">No devices yet</h2>
        <p className="text-muted text-sm mt-1 max-w-xs">
          Scan the QR code on your device to add it.
        </p>
      </div>
      <Link to="/add">
        <Button size="lg">Add your first device</Button>
      </Link>
    </div>
  );
}
