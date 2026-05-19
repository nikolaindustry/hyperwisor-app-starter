import { appConfig } from "@config";

export function Logo({ size = 48 }: { size?: number }) {
  // Falls back to first letter of appName if no logo asset is set.
  if (!appConfig.logoUrl) {
    return (
      <div
        className="rounded bg-primary text-primary-foreground font-bold flex items-center justify-center"
        style={{ width: size, height: size, fontSize: size / 2 }}
      >
        {appConfig.appName.charAt(0)}
      </div>
    );
  }
  return (
    <img
      src={appConfig.logoUrl}
      alt={appConfig.appName}
      width={size}
      height={size}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
