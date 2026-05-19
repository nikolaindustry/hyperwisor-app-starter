import { appConfig } from "@config";

/**
 * Applies app.config.ts colors as CSS variables at runtime.
 * Called once from main.tsx before React renders.
 */
export function applyThemeFromConfig(): void {
  const root = document.documentElement.style;
  root.setProperty("--color-primary", appConfig.colors.primary);
  root.setProperty("--color-primary-foreground", appConfig.colors.primaryForeground);
  root.setProperty("--color-accent", appConfig.colors.accent);
  root.setProperty("--color-background", appConfig.colors.background);
  root.setProperty("--color-surface", appConfig.colors.surface);
  root.setProperty("--color-text", appConfig.colors.text);
  root.setProperty("--color-muted", appConfig.colors.muted);
  root.setProperty("--color-border", appConfig.colors.border);
  root.setProperty("--color-success", appConfig.colors.success);
  root.setProperty("--color-danger", appConfig.colors.danger);
  root.setProperty("--font-sans", appConfig.font);
  root.setProperty("--radius", appConfig.borderRadius);
  document.title = appConfig.appName;
}
