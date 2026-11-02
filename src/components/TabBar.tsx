import { NavLink } from "react-router-dom";
import { Activity, LayoutGrid, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/devices", label: "Devices", icon: LayoutGrid },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/account", label: "Account", icon: User },
];

/** Persistent bottom navigation for the app's top-level tabs. */
export function TabBar() {
  return (
    <nav
      className="sticky bottom-0 z-30 bg-background"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch gap-2.5 max-w-md mx-auto px-4 pt-3 pb-1">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg",
                "transition-shadow duration-150",
                // The current tab is a pressed key, not a coloured label.
                isActive ? "shadow-press-sm" : "active:shadow-press-sm",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "flex items-center justify-center transition-colors",
                    isActive ? "text-primary" : "text-muted",
                  )}
                >
                  <Icon size={21} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span
                  className={cn(
                    "text-[11px] transition-colors",
                    isActive ? "text-primary font-semibold" : "text-muted font-medium",
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
