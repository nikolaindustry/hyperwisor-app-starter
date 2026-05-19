import type { CapacitorConfig } from "@capacitor/cli";
import { appConfig } from "./app.config";

const config: CapacitorConfig = {
  appId: appConfig.bundleId,
  appName: appConfig.appName,
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: appConfig.colors.background,
    },
    BarcodeScanner: {
      cameraDirection: "back",
    },
  },
};

export default config;
