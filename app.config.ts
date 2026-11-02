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
    "https://hyperwisor.nikolaindustry.workers.dev/functions/v1",

  // The Hyperwisor Secure Channel. This is the platform's ONLY relay; the
  // previous unauthenticated one was retired on 2026-07-30 and has since been
  // repurposed for unrelated work.
  //
  // Do not point this anywhere else to "test" something. A WebSocket that
  // never opens looks exactly like a device that is merely offline, so a
  // wrong host here fails silently -- no error, no log, just an app where
  // nothing ever responds.
  relayHost:
    import.meta.env.VITE_HW_RELAY_HOST ||
    "hyperwisor-realtime-secure.onrender.com",

  // --- Theme ------------------------------------------------------
  // Light + dark palettes, piped to Tailwind via CSS variables.
  // `defaultThemeMode` is the initial mode; "system" follows the OS and
  // the user can override it from the Account screen.
  //
  // Most manufacturers only change `primary` (and maybe `accent`) in both
  // palettes — the neutrals are tuned for a clean, professional look.
  defaultThemeMode: "system" as "light" | "dark" | "system",
  theme: {
    // Soft UI: `background` and `card` are deliberately THE SAME colour.
    // Depth comes from a light above-left and a shadow below-right, so a card
    // has to sit on its own tone -- there is nothing lighter than white to
    // highlight with, which is why the ground moved off #FBFBFC.
    //
    // The text shades are darker than a flat theme's for a reason: on this
    // ground the old #71717A grey falls to 3.5:1 and #16A34A to 2.7:1, both
    // below WCAG AA. Fills stay bright; only text shades moved.
    light: {
      primary: "#2563EB",
      primaryForeground: "#FFFFFF",
      accent: "#0F766E",
      background: "#E9EBF0", // the ground
      card: "#E9EBF0", // same as the ground, on purpose
      surface: "#DFE2E9", // recessed wells
      text: "#17191D",
      muted: "#5A5F6B", // 5.3:1
      border: "#D3D7E0", // only for hairlines the shadows cannot carry
      success: "#166534", // 5.9:1
      danger: "#991B1B",
    },
    // Dark needs the same lift for the same reason: #09090B leaves no room
    // for a light edge either. This is a visible change on OLED -- a near
    // black ground cannot do soft UI, so it is a trade, not an oversight.
    dark: {
      primary: "#3B82F6",
      primaryForeground: "#FFFFFF",
      accent: "#2DD4BF",
      background: "#1C1E22",
      card: "#1C1E22",
      surface: "#17191C",
      text: "#F2F3F5",
      muted: "#A2A8B4", // 7.1:1
      border: "#2A2E34",
      success: "#4ADE80",
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
