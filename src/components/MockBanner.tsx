import { isMockMode } from "@config";

export function MockBanner() {
  if (!isMockMode()) return null;
  return (
    <div className="bg-accent/10 border-b border-accent/20 text-[11px] text-foreground px-4 py-1.5 text-center font-medium">
      Demo mode — set <code className="text-accent">VITE_HW_API_KEY</code> in{" "}
      <code className="text-accent">.env.local</code> to go live
    </div>
  );
}
