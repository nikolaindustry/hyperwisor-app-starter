/**
 * Getting a newly added device onto Wi-Fi and online.
 *
 * The order of the steps is forced by the hardware, not chosen:
 *
 *   wifi        collect the network the device should join
 *   connect_ap  the phone must leave its own network and join the DEVICE's,
 *               because the device is not on the internet yet. This step
 *               cannot be skipped or done in the background, so it asks and
 *               waits for the person to confirm.
 *   delivering  one native HTTP call hands the credentials over and reads the
 *               device's public key back
 *   securing    the phone returns to the internet and the queued key is
 *               registered. Only now can the platform recognise the device.
 *   online      the relay reports the device connected
 *   unseen      it did not arrive in time -- said plainly, because a wrong
 *               Wi-Fi password looks exactly like a device still trying
 *
 * What this screen must never do is claim success it has not seen. The device
 * does not report back that credentials failed; it reboots and retries
 * silently. So "not seen yet" is the honest state, and it is a real outcome
 * rather than an error.
 */

import * as React from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Wifi, Smartphone, KeyRound, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { isMockMode } from "@config";
import { realtime } from "@/lib/realtime";
import {
  provisionDeviceNative,
  flushPendingRegistrations,
  pendingRegistrationCount,
} from "@/lib/provisioning";
import { useAuth } from "@/auth/AuthProvider";
import type { UserDevice } from "@/lib/types";

type Stage = "wifi" | "connect_ap" | "delivering" | "securing" | "online" | "unseen";
type RouteState = { device: UserDevice };

/* How long to wait for the device to appear before saying so. The device
 * reboots, joins, and authenticates; on a slow network that is tens of
 * seconds, so a short timeout would call a working setup a failure. */
const PRESENCE_TIMEOUT_MS = 120_000;
const PRESENCE_POLL_MS = 5_000;

/* The person can leave the waiting screen after this long. The work carries on
 * without the screen -- the registration queue and the relay do not need it. */
const ESCAPE_AFTER_MS = 60_000;

const AP_PREFIX = "NIKOLAINDUSTRY_Setup";
const AP_PASSWORD = "0123456789";

export function DeviceSetupScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as RouteState | null;

  const [stage, setStage] = React.useState<Stage>("wifi");
  const [ssid, setSsid] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [canLeave, setCanLeave] = React.useState(false);
  const [keyRegistered, setKeyRegistered] = React.useState(false);

  const device = state?.device;
  const deviceId = device?.id;

  /* Watch for the device on the relay. Presence is answered from the relay's
   * own map, scoped to this session -- not by asking the device, which would
   * test whether its firmware is free to reply rather than whether it is
   * connected, and would need the write grant. */
  React.useEffect(() => {
    if (stage !== "securing" || !deviceId) return;
    let cancelled = false;

    // The demo has no relay to ask, so it resolves on a timer instead.
    if (isMockMode()) {
      void (async () => {
        const { mock } = await import("@/lib/mock");
        await mock.awaitPresence();
        if (!cancelled) setStage("online");
      })();
      return () => {
        cancelled = true;
      };
    }

    const off = realtime.onMessage((msg) => {
      const data = msg as unknown as { type?: string; devices?: unknown[] };
      if (data?.type !== "connectedDevices" || !Array.isArray(data.devices)) return;
      const hit = data.devices.some((d) => {
        if (typeof d === "string") return d === deviceId;
        const o = d as { deviceId?: string; id?: string };
        return (o?.deviceId ?? o?.id) === deviceId;
      });
      if (hit && !cancelled) setStage("online");
    });

    const ask = () => realtime.requestPresence();
    ask();
    const poll = setInterval(ask, PRESENCE_POLL_MS);
    const giveUp = setTimeout(() => {
      if (!cancelled) setStage("unseen");
    }, PRESENCE_TIMEOUT_MS);

    return () => {
      cancelled = true;
      off();
      clearInterval(poll);
      clearTimeout(giveUp);
    };
  }, [stage, deviceId]);

  /* Flush the queued key once the phone is back on a real network. The phone
   * had no internet when the key was captured, so this is the first chance. */
  React.useEffect(() => {
    if (stage !== "securing") return;
    let cancelled = false;

    const attempt = async () => {
      await flushPendingRegistrations();
      if (cancelled) return;
      const left = await pendingRegistrationCount();
      if (!cancelled && left === 0) setKeyRegistered(true);
    };

    void attempt();
    const retry = setInterval(() => void attempt(), 4000);
    return () => {
      cancelled = true;
      clearInterval(retry);
    };
  }, [stage]);

  /* Let the person go once waiting has been long enough to feel stuck. */
  React.useEffect(() => {
    if (stage !== "securing") return;
    setCanLeave(false);
    const t = setTimeout(() => setCanLeave(true), ESCAPE_AFTER_MS);
    return () => clearTimeout(t);
  }, [stage]);

  if (!device) return <Navigate to="/devices" replace />;

  async function deliver() {
    setStage("delivering");
    setError(null);

    const outcome = await provisionDeviceNative({
      ssid: ssid.trim(),
      password,
      targetId: device!.id,
      userId: user?.id ?? null,
    });

    if (!outcome.ok) {
      setError(outcome.error ?? "Provisioning failed.");
      setStage("connect_ap");
      return;
    }
    setStage("securing");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader title="Set up your device" showBack={stage === "wifi"} />
      <div className="flex-1 p-4 flex flex-col">
        {stage === "wifi" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (ssid.trim()) setStage("connect_ap");
            }}
            className="flex flex-col gap-4"
          >
            <StepIcon icon={<Wifi size={22} />} title="Which Wi-Fi should it join?" />
            <Field
              label="Network name (SSID)"
              hint="2.4 GHz only — the device's radio cannot see 5 GHz networks."
            >
              <Input value={ssid} onChange={(e) => setSsid(e.target.value)} autoFocus required />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" size="lg" className="mt-1">
              Continue
            </Button>
          </form>
        )}

        {stage === "connect_ap" && (
          <div className="flex flex-col gap-4">
            <StepIcon
              icon={<Smartphone size={22} />}
              title="Connect this phone to the device"
            />
            <p className="text-sm text-muted leading-relaxed">
              The device is not on the internet yet, so your phone has to join{" "}
              <strong>its</strong> network for one step. Open your Wi-Fi settings and
              connect to:
            </p>
            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <Row label="Network starting" value={`${AP_PREFIX}…`} />
              <Row label="Password" value={AP_PASSWORD} />
            </div>
            <p className="text-xs text-muted">
              The name may have up to six extra characters after that — the device adds
              part of its own id when it has one, so a factory-fresh unit shows the bare
              name. Your phone will also say the network has no internet, which is
              expected; come back here and tap below.
            </p>
            {error && <ErrorNote>{error}</ErrorNote>}
            <Button size="lg" onClick={() => void deliver()}>
              I'm connected to the device
            </Button>
          </div>
        )}

        {stage === "delivering" && (
          <Waiting
            icon={<Wifi size={22} />}
            title="Handing over your Wi-Fi"
            body="Sending the network details to the device and reading back its secure identity."
          />
        )}

        {stage === "securing" && (
          <div className="flex flex-col gap-4">
            <Waiting
              icon={keyRegistered ? <CheckCircle2 size={22} /> : <KeyRound size={22} />}
              title={keyRegistered ? "Security key registered" : "Registering the security key"}
              body={
                keyRegistered
                  ? "Waiting for the device to restart and connect. This usually takes a few seconds."
                  : "Reconnect this phone to your normal Wi-Fi if it hasn't already — the key is sent from here."
              }
            />
            {canLeave && (
              <>
                <p className="text-xs text-muted">
                  Still going. You can close this — setup continues in the background and
                  the device will appear in your list when it connects.
                </p>
                <Button variant="secondary" onClick={() => navigate("/devices", { replace: true })}>
                  Close
                </Button>
              </>
            )}
          </div>
        )}

        {stage === "online" && (
          <div className="flex flex-col gap-4">
            <StepIcon icon={<CheckCircle2 size={22} />} title="Device is ready" />
            <p className="text-sm text-muted leading-relaxed">
              {device.device_name} is online and connected.
            </p>
            <Button
              size="lg"
              onClick={() => {
                toast.push("Device is online", "success");
                navigate(`/devices/${device.id}`, { replace: true });
              }}
            >
              Open device
            </Button>
          </div>
        )}

        {stage === "unseen" && (
          <div className="flex flex-col gap-4">
            <StepIcon icon={<Clock size={22} />} title="Not seen yet" />
            <p className="text-sm text-muted leading-relaxed">
              The device took the Wi-Fi details but has not connected. It keeps retrying
              on its own, so it may still appear — but if the password was wrong it will
              retry silently forever, with nothing to show here.
            </p>
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted">
              <p className="font-medium text-foreground mb-2">Worth checking</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>The network is 2.4 GHz, not 5 GHz only.</li>
                <li>The password is right — including its capitals.</li>
                <li>
                  The device is in range of the router. Once it has credentials it will
                  not raise its setup network again by itself, so putting it back into
                  setup mode means using its reset button or mode switch.
                </li>
              </ul>
            </div>
            <Button size="lg" onClick={() => setStage("wifi")}>
              Try again
            </Button>
            <Button variant="secondary" onClick={() => navigate("/devices", { replace: true })}>
              Back to my devices
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- small presentational helpers --------------------------------- */

function StepIcon({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h2 className="font-semibold text-lg leading-tight">{title}</h2>
    </div>
  );
}

function Waiting({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-10">
      <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-pulse">
        {icon}
      </div>
      <h2 className="font-semibold text-lg">{title}</h2>
      <p className="text-sm text-muted max-w-xs leading-relaxed">{body}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-muted">{label}</span>
      <span className="font-mono font-medium text-right break-all">{value}</span>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 flex gap-2.5 text-sm">
      <AlertTriangle size={17} className="text-danger shrink-0 mt-0.5" />
      <span className="text-foreground leading-relaxed">{children}</span>
    </div>
  );
}
