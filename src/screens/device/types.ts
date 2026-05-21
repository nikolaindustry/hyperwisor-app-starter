import type { UserDevice } from "@/lib/types";

/**
 * Props every product device screen receives.
 *
 * A "device screen" is the bespoke, AI-generated UI for one product.
 * It owns the entire device experience below the app header.
 */
export type DeviceScreenProps = {
  device: UserDevice;
};

export type DeviceScreen = React.ComponentType<DeviceScreenProps>;
