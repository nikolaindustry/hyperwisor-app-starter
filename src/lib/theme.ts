import { appConfig } from "@config";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "hyperwisor.theme";

/** The user's saved theme choice, or the configured default. */
export function getStoredMode(): ThemeMode {
  if (typeof localStorage === "undefined") return appConfig.defaultThemeMode;
  const v = localStorage.getItem(THEME_STORAGE_KEY);
  return v === "light" || v === "dark" || v === "system"
    ? v
    : appConfig.defaultThemeMode;
}

/** Apply the saved theme before React renders — prevents a flash. */
export function initTheme(): void {
  applyTheme(resolveTheme(getStoredMode()));
}

/** Resolve "system" to an actual theme using the OS preference. */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

/**
 * Apply a resolved theme's palette as CSS variables on <html>.
 * Called by ThemeProvider whenever the theme changes.
 */
export function applyTheme(resolved: ResolvedTheme): void {
  const palette = appConfig.theme[resolved];
  const root = document.documentElement;
  const s = root.style;

  s.setProperty("--color-primary", palette.primary);
  s.setProperty("--color-primary-foreground", palette.primaryForeground);
  s.setProperty("--color-accent", palette.accent);
  s.setProperty("--color-background", palette.background);
  s.setProperty("--color-card", palette.card);
  s.setProperty("--color-surface", palette.surface);
  s.setProperty("--color-text", palette.text);
  s.setProperty("--color-muted", palette.muted);
  s.setProperty("--color-border", palette.border);
  s.setProperty("--color-success", palette.success);
  s.setProperty("--color-danger", palette.danger);
  s.setProperty("--font-sans", appConfig.font);
  s.setProperty("--radius", appConfig.borderRadius);

  // data-theme drives the elevation/shadow scale (shadows only in light).
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}
