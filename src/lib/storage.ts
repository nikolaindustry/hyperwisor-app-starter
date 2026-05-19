/**
 * Token storage abstraction.
 *
 * On native (Capacitor), uses @capacitor/preferences (encrypted on iOS,
 * EncryptedSharedPreferences on Android). On web, falls back to
 * localStorage. Never use localStorage on native — it's not secure.
 */

type Stored = { value: string | null };

const isCapacitor = (): boolean =>
  typeof window !== "undefined" &&
  // @ts-expect-error capacitor global
  Boolean(window?.Capacitor?.isNativePlatform?.());

let prefsModule: typeof import("@capacitor/preferences") | null = null;

async function getPrefs() {
  if (!isCapacitor()) return null;
  if (!prefsModule) prefsModule = await import("@capacitor/preferences");
  return prefsModule.Preferences;
}

export const storage = {
  async get(key: string): Promise<string | null> {
    const prefs = await getPrefs();
    if (prefs) {
      const { value }: Stored = await prefs.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    const prefs = await getPrefs();
    if (prefs) return prefs.set({ key, value });
    localStorage.setItem(key, value);
  },
  async remove(key: string): Promise<void> {
    const prefs = await getPrefs();
    if (prefs) return prefs.remove({ key });
    localStorage.removeItem(key);
  },
};
