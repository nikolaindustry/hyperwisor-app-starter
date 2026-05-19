import { isMockMode } from "@config";

export function MockBanner() {
  if (!isMockMode()) return null;
  return (
    <div className="bg-accent/15 border-b border-accent/30 text-xs text-foreground px-4 py-2 text-center">
      Running in <strong>mock mode</strong>. Set <code>apiKey</code> in
      {" "}<code>app.config.ts</code> to go live.
    </div>
  );
}
