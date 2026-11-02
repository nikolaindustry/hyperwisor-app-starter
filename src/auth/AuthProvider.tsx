import * as React from "react";
import { sdk } from "@/lib/sdk";
import { storage } from "@/lib/storage";
import {
  useAccessTokenForRegistration,
  flushPendingRegistrations,
} from "@/lib/provisioning";
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
    // A storage failure must not fail the sign-in. The session is already in
    // memory and works for this run; all that is lost is surviving a restart.
    // Reporting "could not sign in" when the user is, in fact, signed in sends
    // them to re-check a password that was never the problem.
    try {
      if (s) await storage.set(STORAGE_KEY, JSON.stringify(s));
      else await storage.remove(STORAGE_KEY);
    } catch (e) {
      console.warn("[auth] could not persist the session:", (e as Error).message);
    }
  }, []);

  // The transport reads the access token through a ref, so a token refresh is
  // picked up on the next reconnect without re-opening the socket here.
  const sessionRef = React.useRef<Session | null>(null);
  sessionRef.current = session;
  React.useEffect(() => {
    sdk.useAccessToken(() => sessionRef.current?.access_token);
    useAccessTokenForRegistration(() => sessionRef.current?.access_token);
  }, []);

  // Keep the realtime connection in sync with the signed-in user.
  //
  // Signing in or out tears the socket down deliberately: a socket keeps the
  // grants it authenticated with for life, so one that outlived an account
  // switch would carry the previous identity's authority.
  React.useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      sdk.connectRealtime(userId);
      // The app may have been killed between capturing a device key and
      // sending it. The queue survives that; nothing else would retry it.
      void flushPendingRegistrations();
    }
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
          if (isActive) {
            sdk.resumeRealtime();
            // A key captured on the device's access point could not be sent
            // then; this is a chance to try again.
            void flushPendingRegistrations();
          }
        });
        detach = () => void handle.remove();
      } catch {
        // Web build: no Capacitor runtime. visibilitychange is the equivalent.
        const onVisible = () => {
          if (document.visibilityState === "visible") {
            sdk.resumeRealtime();
            void flushPendingRegistrations();
          }
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
