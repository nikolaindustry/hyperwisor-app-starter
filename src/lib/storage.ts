/**
 * Token storage abstraction.
 *
 * On native (Capacitor), uses @capacitor/preferences (encrypted on iOS,
 * EncryptedSharedPreferences on Android). On web, falls back to
 * localStorage. Never use localStorage on native — it's not secure.
 */

type Prefs = typeof import("@capacitor/preferences").Preferences;
type Stored = { value: string | null };

const isCapacitor = (): boolean =>
  typeof window !== "undefined" &&
  // @ts-expect-error capacitor global
  Boolean(window?.Capacitor?.isNativePlatform?.());

let prefsModule: typeof import("@capacitor/preferences") | null = null;

/**
 * Resolve the Preferences plugin, wrapped in an object.
 *
 * The wrapper is not decoration, and removing it breaks the app on a device.
 *
 * A Capacitor plugin is a Proxy that forwards ANY property access to native.
 * An async function resolves whatever it returns, and resolving a value makes
 * the runtime probe it for `.then` to decide whether it is thenable. Return
 * the plugin directly and that probe becomes a real native call, which Android
 * answers with:
 *
 *   Error: "Preferences.then()" is not implemented on android
 *
 * The promise rejects, so EVERY read and write failed on device: the session
 * never persisted, and the provisioning key queue silently stored nothing --
 * which defeats the one thing the queue exists for, since the key is captured
 * while the phone is on the device's access point and can only be sent later.
 *
 * None of it is visible on the web, where this branch is never taken.
 * Returning { p } keeps the proxy out of the promise resolution procedure.
 */
async function getPrefs(): Promise<{ p: Prefs } | null> {
  if (!isCapacitor()) return null;
  if (!prefsModule) prefsModule = await import("@capacitor/preferences");
  return { p: prefsModule.Preferences };
}

export const storage = {
  async get(key: string): Promise<string | null> {
    const native = await getPrefs();
    if (native) {
      const { value }: Stored = await native.p.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    const native = await getPrefs();
    if (native) {
      await native.p.set({ key, value });
      return;
    }
    localStorage.setItem(key, value);
  },
  async remove(key: string): Promise<void> {
    const native = await getPrefs();
    if (native) {
      await native.p.remove({ key });
      return;
    }
    localStorage.removeItem(key);
  },
};
