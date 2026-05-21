import type { DeviceScreen } from "./types";
import { SmartThermostatScreen } from "./examples/SmartThermostatScreen";
import { SmartBikeScreen } from "./smart-bike/SmartBikeScreen";
import { GangSwitchScreen } from "./gang-switch/GangSwitchScreen";

/**
 * Maps a product id → its bespoke device screen.
 *
 * HOW THIS WORKS
 * --------------
 * When a user opens a device, DeviceDetailScreen looks up the device's
 * `product_id` here. If a screen is registered, that bespoke UI renders.
 * Otherwise it falls back to the generic command list.
 *
 * FOR THE AI AGENT
 * ----------------
 * After generating a screen for a product, add ONE line here:
 *
 *   import { CamperVanScreen } from "./camper-van/CamperVanScreen";
 *   ...
 *   "1f577a41-080e-4f77-8162-30df2c5e82e9": CamperVanScreen,
 *
 * See CLAUDE.md for the full generation workflow.
 *
 * The "demo-product-001" entry below is the mock-mode demo product, wired
 * to the example screen so the starter shows a real bespoke UI out of the box.
 */
export const productScreens: Record<string, DeviceScreen> = {
  "demo-product-001": SmartThermostatScreen,
  // Smart Bike
  "2935cd69-302d-42f0-8708-3bd909ffc647": SmartBikeScreen,
  // 5ch_gang_with_1_fan
  "4fb8f51a-0f84-4cae-9060-27d8949360e2": GangSwitchScreen,
};

export function getDeviceScreen(productId: string): DeviceScreen | null {
  return productScreens[productId] ?? null;
}
