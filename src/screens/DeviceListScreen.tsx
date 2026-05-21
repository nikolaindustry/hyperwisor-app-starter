import { Link, useNavigate } from "react-router-dom";
import { Plus, PackagePlus } from "lucide-react";
import { useDevices } from "@/hooks/useDevices";
import { DeviceCard } from "@/components/DeviceCard";
import { AppHeader, HeaderAction } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { appConfig } from "@config";
import type { UserDevice } from "@/lib/types";

export function DeviceListScreen() {
  const navigate = useNavigate();
  const { data: devices, isLoading } = useDevices();

  const grouped = (devices ?? []).reduce<Record<string, UserDevice[]>>((acc, d) => {
    const key = d.iot_products?.product_name ?? "Other";
    (acc[key] ||= []).push(d);
    return acc;
  }, {});

  const count = devices?.length ?? 0;

  return (
    <div className="flex flex-col">
      <AppHeader
        title="My Devices"
        subtitle={count > 0 ? `${count} device${count === 1 ? "" : "s"}` : undefined}
        right={
          <HeaderAction
            icon={<Plus size={20} />}
            label="Add device"
            onClick={() => navigate("/add")}
          />
        }
      />

      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[68px] w-full" />
            ))}
          </div>
        ) : count === 0 ? (
          <EmptyState />
        ) : appConfig.mode === "multi-product" ? (
          <div className="flex flex-col gap-6">
            {Object.entries(grouped).map(([family, list]) => (
              <section key={family}>
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2 px-0.5">
                  {family}
                </h2>
                <div className="flex flex-col gap-2.5">
                  {list.map((d) => (
                    <DeviceCard key={d.id} device={d} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {(devices ?? []).map((d) => (
              <DeviceCard key={d.id} device={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center mt-20 gap-4">
      <div className="w-[72px] h-[72px] rounded-2xl bg-surface flex items-center justify-center">
        <PackagePlus size={34} className="text-muted" />
      </div>
      <div className="space-y-1">
        <h2 className="font-semibold text-lg">No devices yet</h2>
        <p className="text-muted text-sm max-w-[15rem]">
          Scan the QR code on your device to add it to your account.
        </p>
      </div>
      <Link to="/add" className="mt-1">
        <Button size="lg">
          <Plus size={18} />
          Add your first device
        </Button>
      </Link>
    </div>
  );
}
