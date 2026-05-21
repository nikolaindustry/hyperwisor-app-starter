import { Outlet } from "react-router-dom";
import { TabBar } from "./TabBar";

/**
 * Shell for the top-level tab screens (Devices, Activity, Account).
 * Renders the active tab plus the persistent bottom navigation.
 */
export function TabLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
