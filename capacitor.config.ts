import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native shell configuration.
 *
 * These values are deliberately LITERAL rather than imported from
 * app.config.ts. The Capacitor CLI loads this file by transpiling it to
 * CommonJS, and this package is ESM ("type": "module"), so importing a second
 * TypeScript module here fails with `exports is not defined in ES module
 * scope` -- and every `cap` command then stops before it starts, which is why
 * the native build had never run.
 *
 * So: when you change `appName` or `bundleId` in app.config.ts, change them
 * here too. Two lines, once, at setup.
 */
const config: CapacitorConfig = {
  appId: "com.acme.devices",
  appName: "Acme Devices",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#FBFBFC",
    },
    BarcodeScanner: {
      cameraDirection: "back",
    },
  },
};

export default config;
