/**
 * Handing Wi-Fi credentials to a device over its own setup access point, and
 * registering the identity it hands back.
 *
 * Two things happen here that are easy to get wrong.
 *
 * 1. The credentials go over NATIVE HTTP, not through the WebView.
 *
 *    The device's setup page is plain HTTP on 192.168.4.1. A `fetch` from the
 *    WebView is blocked by CORS and mixed-content rules, so it must go through
 *    CapacitorHttp, which uses the native stack where those rules do not apply.
 *    Android additionally needs cleartext permitted for that address --
 *    see docs/PROVISIONING.md.
 *
 *    Opening the device's page in a browser instead looks simpler and is not:
 *    the page needs a "Return to App" TAP to fire a deep link carrying the
 *    public key. Close the browser rather than tapping and the key is never
 *    captured, nothing queues, and the app waits for something that is not
 *    coming.
 *
 * 2. The key is QUEUED, not uploaded.
 *
 *    At the moment the key is captured the phone is on the device's access
 *    point, which has no internet. Uploading there always fails. So the key is
 *    persisted first (it is a public key -- storing it is not a secret leak)
 *    and flushed once the phone is back on a real network.
 *
 * Registration carries the signed-in user's session, and the edge function
 * verifies that user owns the device row. Making this reliable did not move
 * any trust to the device: the ownership proof that prevents hijacking is
 * unchanged.
 */

import { appConfig, isMockMode } from "@config";
import { storage } from "./storage";

/** Default address of a device in setup mode. */
export const DEVICE_AP_IP = "192.168.4.1";

/**
 * Flat rather than a discriminated union, to match the platform's version and
 * stay readable for callers that do not narrow.
 *
 *   unreachable — never reached the device; almost always "not on its AP"
 *   no_key      — reached it, but it has no secure identity to give
 */
export interface ProvisionOutcome {
  ok: boolean;
  deviceId?: string;
  reason?: "unreachable" | "no_key";
  error?: string;
}

export interface ProvisionArgs {
  /** Device address while it is in setup mode. */
  ip?: string;
  ssid: string;
  password: string;
  /** The user_devices row id created by onboardDevice(). */
  targetId: string;
  userId?: string | null;
  metadata?: { key: string; value: string }[] | null;
}

export function buildProvisionUrl({
  ip = DEVICE_AP_IP,
  ssid,
  password,
  targetId,
  userId,
  metadata,
}: ProvisionArgs): string {
  const url = new URL(`http://${ip}/api/provision`);
  url.searchParams.append("ssid", ssid);
  url.searchParams.append("password", password);
  url.searchParams.append("target_id", targetId);
  if (userId) url.searchParams.append("user_id", userId);
  metadata?.forEach((item) => {
    // "meta_" prefix, spaces replaced, to keep the key URL-friendly.
    url.searchParams.append(`meta_${item.key.replace(/\s+/g, "_")}`, item.value);
  });
  return url.toString();
}

/**
 * Pull the device's identity out of its provisioning-success response.
 *
 * The device embeds a "Return to App" link of the shape
 *   <scheme>://provisioning?status=success&…&public_key=<urlenc b64>&device_id=<id>
 * and the public key is read from there. The device id is already known -- it
 * is the target_id just sent, which the caller owns, which is what makes the
 * registration authorised.
 */
export function captureDeviceIdentity(
  html: string,
  targetId: string,
): { deviceId: string; publicKey: string } | null {
  if (!html) return null;
  const pk = html.match(/public_key=([^&"'\s<]+)/);
  if (!pk) return null;
  try {
    const publicKey = decodeURIComponent(pk[1]);
    const idMatch = html.match(/device_id=([^&"'\s<]+)/);
    const deviceId = idMatch ? decodeURIComponent(idMatch[1]) : targetId;
    return { deviceId, publicKey };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Registration queue
 * ------------------------------------------------------------------ */

const QUEUE_KEY = "hyperwisor.pending_registrations";

export interface PendingRegistration {
  deviceId: string;
  publicKey: string;
  queuedAt: number;
}

/** Returns the signed-in user's access token. Set by the auth layer. */
type AccessTokenGetter = () => string | null | undefined;
let getAccessToken: AccessTokenGetter = () => null;

export function useAccessTokenForRegistration(getter: AccessTokenGetter): void {
  getAccessToken = getter;
}

async function loadQueue(): Promise<PendingRegistration[]> {
  try {
    const raw = await storage.get(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveQueue(items: PendingRegistration[]): Promise<void> {
  try {
    if (items.length) await storage.set(QUEUE_KEY, JSON.stringify(items));
    else await storage.remove(QUEUE_KEY);
  } catch (e) {
    console.warn("[HSC] could not persist registration queue:", e);
  }
}

interface RegisterResult {
  ok: boolean;
  error?: string;
  /** False when retrying can never help -- a bad key, or you don't own it. */
  retryable: boolean;
}

/**
 * Register one device's public key against the signed-in user's account.
 *
 * 401 means the session is not ready yet and 5xx/network means the platform or
 * the link is unavailable -- both worth retrying. 400 and 403 are verdicts:
 * the key is malformed, or this user does not own that device. Retrying those
 * loops forever and hides the real reason.
 */
async function registerDevicePublicKey(
  deviceId: string,
  publicKey: string,
): Promise<RegisterResult> {
  const accessToken = getAccessToken();
  if (!accessToken) return { ok: false, error: "not signed in", retryable: true };

  try {
    const res = await fetch(`${appConfig.apiBaseUrl}/relay-register-device`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ device_id: deviceId, public_key: publicKey, algo: "p256" }),
    });

    const text = await res.text();
    const body = text ? JSON.parse(text) : {};

    if (!res.ok) {
      const retryable = res.status === 401 || res.status >= 500;
      return { ok: false, error: body?.error || `HTTP ${res.status}`, retryable };
    }
    if (!body?.success) {
      return { ok: false, error: body?.error || "unknown response", retryable: true };
    }
    return { ok: true, retryable: false };
  } catch (e) {
    // Thrown before a response arrived — almost always offline.
    return { ok: false, error: (e as Error).message || "network error", retryable: true };
  }
}

let flushing = false;

/**
 * Try to register everything queued. Safe to call often: on resume, when the
 * network returns, and on startup.
 */
export async function flushPendingRegistrations(): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  try {
    const queue = await loadQueue();
    if (!queue.length) return 0;

    const remaining: PendingRegistration[] = [];
    let succeeded = 0;

    for (const item of queue) {
      if (!item?.deviceId || !item?.publicKey) continue; // corrupt entry

      const result = await registerDevicePublicKey(item.deviceId, item.publicKey);
      if (result.ok) {
        succeeded += 1;
      } else if (result.retryable) {
        remaining.push(item);
      } else {
        console.warn(`[HSC] dropping unregisterable device ${item.deviceId}: ${result.error}`);
      }
    }

    await saveQueue(remaining);
    return succeeded;
  } finally {
    flushing = false;
  }
}

/**
 * Persist a captured key, then try to send it.
 *
 * Returns true if it registered immediately, false if it was queued — which is
 * the normal outcome during provisioning, because the phone is still on the
 * device's access point.
 */
export async function enqueueDeviceRegistration(
  deviceId: string,
  publicKey: string,
): Promise<boolean> {
  const queue = await loadQueue();
  if (!queue.some((i) => i.deviceId === deviceId && i.publicKey === publicKey)) {
    queue.push({ deviceId, publicKey, queuedAt: Date.now() });
    await saveQueue(queue);
  }
  const sent = await flushPendingRegistrations();
  return sent > 0;
}

export async function pendingRegistrationCount(): Promise<number> {
  return (await loadQueue()).length;
}

/* ------------------------------------------------------------------ *
 * The provisioning call itself
 * ------------------------------------------------------------------ */

/**
 * Send the credentials and capture the device's key in one round trip.
 *
 * Web builds cannot do this: there is no native HTTP stack, so the request is
 * blocked before it leaves. The flow surfaces that rather than appearing to
 * hang.
 */
export async function provisionDeviceNative(args: ProvisionArgs): Promise<ProvisionOutcome> {
  if (isMockMode()) {
    const { mock } = await import("./mock");
    return mock.provisionDevice(args.targetId);
  }

  const url = buildProvisionUrl(args);

  let html = "";
  try {
    const { CapacitorHttp } = await import("@capacitor/core");
    const resp = await CapacitorHttp.get({ url, connectTimeout: 8000, readTimeout: 8000 });
    html = typeof resp.data === "string" ? resp.data : String(resp.data ?? "");
  } catch (err) {
    console.warn("[provision] native http failed:", err);
    return {
      ok: false,
      reason: "unreachable",
      error:
        "Couldn't reach the device. Make sure this phone is connected to the device's setup Wi-Fi, then try again.",
    };
  }

  const captured = captureDeviceIdentity(html, args.targetId);
  if (!captured) {
    console.warn("[provision] device returned no public_key");
    return {
      ok: false,
      reason: "no_key",
      error:
        "The device accepted the Wi-Fi details but returned no secure identity. Its firmware needs to be built with security enabled.",
    };
  }

  await enqueueDeviceRegistration(captured.deviceId, captured.publicKey);
  return { ok: true, deviceId: captured.deviceId };
}
