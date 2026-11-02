import * as React from "react";
import { sdk } from "@/lib/sdk";
import { storage } from "@/lib/storage";
import type { Session, User } from "@/lib/types";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthCtx = React.createContext<AuthState | null>(null);
const STORAGE_KEY = "hyperwisor.session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Restore session on boot.
  React.useEffect(() => {
    (async () => {
      try {
        const raw = await storage.get(STORAGE_KEY);
        if (raw) {
          const parsed: Session = JSON.parse(raw);
          setSession(parsed);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = React.useCallback(async (s: Session | null) => {
    setSession(s);
    if (s) await storage.set(STORAGE_KEY, JSON.stringify(s));
    else await storage.remove(STORAGE_KEY);
  }, []);

  // The transport reads the access token through a ref, so a token refresh is
  // picked up on the next reconnect without re-opening the socket here.
  const sessionRef = React.useRef<Session | null>(null);
  sessionRef.current = session;
  React.useEffect(() => {
    sdk.useAccessToken(() => sessionRef.current?.access_token);
  }, []);

  // Keep the realtime connection in sync with the signed-in user.
  //
  // Signing in or out tears the socket down deliberately: a socket keeps the
  // grants it authenticated with for life, so one that outlived an account
  // switch would carry the previous identity's authority.
  React.useEffect(() => {
    const userId = session?.user?.id;
    if (userId) sdk.connectRealtime(userId);
    return () => sdk.disconnectRealtime();
  }, [session?.user?.id]);

  // Reconnect when the app returns to the foreground. The WebView is frozen
  // while backgrounded, so the reconnect timer never fires there.
  React.useEffect(() => {
    if (!session?.user?.id) return;

    let detach: (() => void) | undefined;
    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) sdk.resumeRealtime();
        });
        detach = () => void handle.remove();
      } catch {
        // Web build: no Capacitor runtime. visibilitychange is the equivalent.
        const onVisible = () => {
          if (document.visibilityState === "visible") sdk.resumeRealtime();
        };
        document.addEventListener("visibilitychange", onVisible);
        detach = () => document.removeEventListener("visibilitychange", onVisible);
      }
    })();

    return () => detach?.();
  }, [session?.user?.id]);

  const signIn = React.useCallback(
    async (email: string, password: string) => {
      const res = await sdk.signIn({ email, password });
      await persist(res.session);
    },
    [persist],
  );

  const signUp = React.useCallback(
    async (email: string, password: string, name?: string) => {
      await sdk.signUp({ email, password, name });
      await signIn(email, password);
    },
    [signIn],
  );

  const signOut = React.useCallback(async () => {
    try {
      await sdk.signOut(session?.access_token);
    } catch {
      /* ignore — clear local state regardless */
    }
    await persist(null);
  }, [session, persist]);

  const resetPassword = React.useCallback(async (email: string) => {
    await sdk.resetPassword(email);
  }, []);

  const value: AuthState = {
    user: session?.user ?? null,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
