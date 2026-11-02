/**
 * Realtime façade (live mode).
 *
 * The transport is the Hyperwisor Secure Channel -- see ./secureRelay.ts for
 * the handshake, keepalive and reconnect behaviour. This file only mints the
 * session token and keeps the connection tied to the signed-in user.
 *
 * Wire format for sending a command (verified against the platform's
 * deviceWebSocketService):
 *   { targetId: "<deviceId>", payload: { commands: [...] } }
 *
 * Mock mode never reaches this file — see src/lib/mock.ts.
 */

import { appConfig } from "@config";
import { secureRelay } from "./secureRelay";
import type { DeviceCommand, RealtimeMessage } from "./types";

type MessageHandler = (msg: RealtimeMessage) => void;

/** Returns the signed-in user's access token, or null. Set by the auth layer. */
type AccessTokenGetter = () => string | null | undefined;

let getAccessToken: AccessTokenGetter = () => null;

/**
 * Mint a short-lived relay session token.
 *
 * `relay-token` derives the socket's grants from whoever is signed in, so the
 * user's own access token is what authorises the mint. It requires nothing
 * else: measured against the deployed function, a request with no
 * Authorization is UNAUTHORIZED_NO_AUTH_HEADER and a malformed one is
 * UNAUTHORIZED_INVALID_JWT_FORMAT.
 */
async function mintRelayToken(): Promise<string | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    const res = await fetch(`${appConfig.apiBaseUrl}/relay-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) {
      console.warn("[HSC] relay-token failed:", res.status);
      return null;
    }
    const data = (await res.json()) as { token?: string };
    return data?.token ?? null;
  } catch (err) {
    console.warn("[HSC] relay-token error:", (err as Error).message);
    return null;
  }
}

export const realtime = {
  /** Supply the token getter before connecting. */
  useAccessToken(getter: AccessTokenGetter) {
    getAccessToken = getter;
  },

  /** Ensure a connection exists for this user. Safe to call repeatedly. */
  connect(userId: string) {
    secureRelay.connect(userId, mintRelayToken);
  },

  /**
   * Tear down the connection (on sign-out).
   *
   * This matters for more than tidiness: a socket keeps the grants it
   * authenticated with for life, so one that outlives an account switch
   * carries the previous identity's authority.
   */
  disconnect() {
    secureRelay.disconnect();
  },

  /** Reconnect if the socket died while the app was backgrounded. */
  resume() {
    secureRelay.resume();
  },

  /** True once the HSC handshake has completed. */
  get isConnected() {
    return secureRelay.isConnected;
  },

  /** Subscribe to all inbound frames. Returns an unsubscribe function. */
  onMessage(handler: MessageHandler): () => void {
    return secureRelay.onMessage(handler);
  },

  /** Subscribe to connection state. Returns an unsubscribe function. */
  onConnectionChange(handler: (connected: boolean) => void): () => void {
    return secureRelay.onConnectionChange(handler);
  },

  /** Ask the relay which devices are connected. */
  requestPresence() {
    secureRelay.requestPresence();
  },

  /** Send commands to a device. */
  sendCommand(deviceId: string, commands: DeviceCommand[], widgetId?: string) {
    secureRelay.sendCommand(deviceId, commands, widgetId);
  },
};
