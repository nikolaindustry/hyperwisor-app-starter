import * as React from "react";
import {
  applyTheme,
  getStoredMode,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeMode,
} from "@/lib/theme";

type ThemeState = {
  mode: ThemeMode; // user choice: light | dark | system
  resolved: ResolvedTheme; // what's actually applied
  setMode: (mode: ThemeMode) => void;
};

const ThemeCtx = React.createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<ThemeMode>(getStoredMode);
  const [resolved, setResolved] = React.useState<ResolvedTheme>(() =>
    resolveTheme(mode),
  );

  // Apply on mount + whenever mode changes.
  React.useEffect(() => {
    const next = resolveTheme(mode);
    setResolved(next);
    applyTheme(next);
  }, [mode]);

  // Follow OS changes while in "system" mode.
  React.useEffect(() => {
    if (mode !== "system" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = resolveTheme("system");
      setResolved(next);
      applyTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = React.useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ThemeCtx.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
