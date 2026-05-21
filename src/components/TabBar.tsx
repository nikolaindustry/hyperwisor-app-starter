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
      className="sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch max-w-md mx-auto">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "flex items-center justify-center transition-colors",
                    isActive ? "text-primary" : "text-muted",
                  )}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted",
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
