import { Link, useNavigate } from "react-router-dom";
import { Plus, PackagePlus, User } from "lucide-react";
import { useDevices } from "@/hooks/useDevices";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/auth/AuthProvider";
import { DeviceCard } from "@/components/DeviceCard";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { appConfig } from "@config";
import type { UserDevice } from "@/lib/types";

/**
 * The first screen after sign-in.
 *
 * It opens with a greeting and a one-line fleet summary rather than a title
 * and a count, because "3 devices" tells you nothing you did not already
 * know. What you open the app to find out is whether everything is up.
 *
 * Deliberately industry-neutral: no rooms, no house, no assumption that a
 * device measures temperature. This template ships for EV chargers and soil
 * sensors as readily as thermostats, so a device is named by whatever its
 * owner called it, and the grouping is by product line.
 */
export function DeviceListScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: devices, isLoading } = useDevices();

  const grouped = (devices ?? []).reduce<Record<string, UserDevice[]>>((acc, d) => {
    const key = d.iot_products?.product_name ?? "Other";
    (acc[key] ||= []).push(d);
    return acc;
  }, {});

  const count = devices?.length ?? 0;
  const online = (devices ?? []).filter((d) => d.is_online).length;
  const firstName = (user?.name ?? "").trim().split(/\s+/)[0];

  return (
    <div className="flex flex-col">
      {/* A quiet brand line, not a second heading competing with the greeting. */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <Logo height={34} />
        <div className="flex items-center gap-2 shrink-0">
          {/* Adding a device is a corner action once you have one. The
              full-width tile below is for an empty account, where it is the
              only thing to do. */}
          {count > 0 ? (
            <button
              type="button"
              aria-label="Add a device"
              onClick={() => navigate("/add")}
              className="w-9 h-9 rounded-md bg-card shadow-lift-sm active:shadow-press-sm
                         flex items-center justify-center transition-shadow"
            >
              <Plus size={17} className="text-primary" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Account"
            onClick={() => navigate("/account")}
            className="w-9 h-9 rounded-md bg-card shadow-lift-sm active:shadow-press-sm
                       flex items-center justify-center transition-shadow"
          >
            <User size={17} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 flex flex-col gap-5">
        <header>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] leading-tight">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          {!isLoading && count > 0 ? (
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`w-[7px] h-[7px] rounded-full ${
                  online === count ? "bg-success" : online > 0 ? "bg-primary" : "bg-muted"
                }`}
              />
              <span className="text-[13.5px] text-muted">
                {online} of {count} device{count === 1 ? "" : "s"} online
              </span>
            </div>
          ) : null}
        </header>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[124px] w-full rounded-lg" />
            ))}
          </div>
        ) : count === 0 ? (
          <EmptyState />
        ) : (
          <>
            {appConfig.mode === "multi-product" ? (
              Object.entries(grouped).map(([family, list]) => (
                <section key={family} className="flex flex-col gap-3">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {family}
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {list.map((d) => (
                      <DeviceCard key={d.id} device={d} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {(devices ?? []).map((d) => (
                  <DeviceCard key={d.id} device={d} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center mt-16 gap-4">
      <div className="w-[76px] h-[76px] rounded-xl bg-card shadow-press flex items-center justify-center">
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
