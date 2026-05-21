/**
 * THE config file.
 *
 * Edit this file to brand the starter as your own. For most manufacturers
 * this is the ONLY file you need to change to ship a working demo.
 *
 * - Identity: name, bundle id, logo, support
 * - Mode: single-product vs multi-product
 * - Credentials: Hyperwisor API + WebSocket
 * - Theme: colors + font (piped to Tailwind via CSS variables)
 * - Features: toggle screens on/off
 *
 * If `apiKey` is left as the placeholder, the app boots in MOCK MODE
 * with fake devices and telemetry. Set real keys to go live.
 */

export type AppMode = "single-product" | "multi-product";

export const appConfig = {
  // --- Identity ---------------------------------------------------
  appName: "Acme Smart Home",
  bundleId: "com.acme.smarthome",
  logoUrl: "/logo.svg",
  supportEmail: "support@acme.com",
  version: "0.1.0",

  // --- Mode -------------------------------------------------------
  // single-product: the app is for one specific device line.
  //   QR scan validates that scanned product matches `productId`.
  // multi-product: the app is for a catalog. QR scan accepts any
  //   product belonging to this manufacturer.
  mode: "multi-product" as AppMode,
  productId: null as string | null, // required if mode === "single-product"

  // --- Credentials ------------------------------------------------
  // Credentials are read from environment variables (see .env.example).
  // Copy .env.example to .env.local and fill in your real keys.
  // If VITE_HW_API_KEY is unset, the app runs in MOCK MODE.
  //
  // NEVER hard-code real keys here — this file is committed to git.
  // SECURITY: do NOT ship `secretKey` in production mobile binaries.
  // See docs/SECURITY.md for the proxy-worker pattern.
  apiKey: import.meta.env.VITE_HW_API_KEY || "DEMO",
  secretKey: import.meta.env.VITE_HW_SECRET_KEY || "DEMO",
  apiBaseUrl:
    import.meta.env.VITE_HW_API_BASE_URL ||
    "https://cgsuxlbravclbbpnvfky.supabase.co/functions/v1",
  realtimeUrl:
    import.meta.env.VITE_HW_REALTIME_URL ||
    "wss://nikolaindustry-realtime.onrender.com",

  // --- Theme ------------------------------------------------------
  // Values are piped to Tailwind via CSS variables. See src/index.css.
  colors: {
    primary: "#0066FF",
    primaryForeground: "#FFFFFF",
    accent: "#00C2A8",
    background: "#FFFFFF",
    surface: "#F5F7FA",
    text: "#0A0A0A",
    muted: "#6B7280",
    border: "#E5E7EB",
    success: "#10B981",
    danger: "#EF4444",
  },
  font: "Inter, system-ui, -apple-system, sans-serif",
  borderRadius: "0.75rem",

  // --- Feature flags ----------------------------------------------
  features: {
    biometricLogin: false,
    pushNotifications: false,
    manualDeviceEntry: true, // allow bypassing QR scan
    sharedDevices: false,
    showSupportLink: true,
  },
} as const;

// Helper used across the app to detect mock mode at runtime.
export const isMockMode = (): boolean =>
  appConfig.apiKey === "DEMO" || appConfig.apiKey.length === 0;
