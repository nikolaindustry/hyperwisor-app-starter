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
  // Light + dark palettes, piped to Tailwind via CSS variables.
  // `defaultThemeMode` is the initial mode; "system" follows the OS and
  // the user can override it from the Account screen.
  //
  // Most manufacturers only change `primary` (and maybe `accent`) in both
  // palettes — the neutrals are tuned for a clean, professional look.
  defaultThemeMode: "system" as "light" | "dark" | "system",
  theme: {
    light: {
      primary: "#2563EB",
      primaryForeground: "#FFFFFF",
      accent: "#0D9488",
      background: "#FBFBFC", // app background
      card: "#FFFFFF", // panels / cards
      surface: "#F4F4F5", // subtle fills: chips, icon wells, secondary buttons
      text: "#18181B",
      muted: "#71717A", // secondary text
      border: "#E4E4E7", // hairline
      success: "#16A34A",
      danger: "#DC2626",
    },
    dark: {
      primary: "#3B82F6",
      primaryForeground: "#FFFFFF",
      accent: "#2DD4BF",
      background: "#09090B",
      card: "#131316",
      surface: "#1F1F23",
      text: "#FAFAFA",
      muted: "#A1A1AA",
      border: "#27272A",
      success: "#22C55E",
      danger: "#F87171",
    },
  },
  font: "Inter, system-ui, -apple-system, sans-serif",
  borderRadius: "0.875rem",

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
