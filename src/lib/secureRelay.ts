/**
 * Hyperwisor Secure Channel (HSC) connection.
 *
 * The platform's only relay is the HSC. It does not accept anonymous sockets:
 * every connection authenticates with a short-lived session token before any
 * frame is delivered or accepted.
 *
 *   open  ──▶  relay sends { type: "challenge" }
 *             ──▶  we send { hsc:"1", type:"session", token }
 *                  ──▶  relay sends { type: "auth_ok" }  → connected
 *
 * Nothing the app sends leaves before auth_ok; frames queued meanwhile are
 * flushed once the handshake completes.
 *
 * Measured against the live relay on 2026-11-02: the challenge arrives ~600ms
 * after open, and a socket that does not answer it is dropped after ~5s with
 * close code 1005, wasClean = true. That last part is the trap -- a refusal is
 * a CLEAN close, indistinguishable from a normal one, so onclose must
 * schedule a reconnect unconditionally rather than only on error. The same
 * mistake cost the ESP-IDF firmware a release: it handled DISCONNECTED but not
 * CLOSED, so a device whose key was not yet registered sat silent forever.
 *
 * The token is minted by the `relay-token` edge function from whoever is
 * signed in at that moment, and a socket keeps the grants it authenticated
 * with for life. Sign-in and sign-out therefore tear the connection down; it
 * reopens with a token for the new identity.
 */

import { appConfig } from "@config";
import type { DeviceCommand, RealtimeMessage } from "./types";

/* Reconnect backoff. Exponential, and jittered: a fixed interval means every
 * app in the field reconnects in lockstep after a relay restart, and that
 * burst keeps the relay down. The window widens with the delay, so the spread
 * is largest where the crowd is biggest. */
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30000;

/* Client keepalive. A NAT mapping is refreshed by traffic going OUT; nothing
 * the relay sends can refresh it. Without this the mapping lapses, everything
 * the relay sends is discarded before it arrives, and the app shows a device
 * as online while nothing reaches it. 20s is comfortably inside the shortest
 * mappings seen in the field. */
const KEEPALIVE_MS = 20000;

type MessageHandler = (msg: RealtimeMessage) => void;
type ConnHandler = (connected: boolean) => void;

export interface RelayTokenSource {
  /** Resolve a session token, or null when nobody is signed in. */
  (): Promise<string | null>;
}

class SecureRelayConnection {
  private ws: WebSocket | null = null;
  private authenticated = false;
  private closedByUser = false;
  private connectionId: string | null = null;
  private getToken: RelayTokenSource | null = null;

  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  private readonly msgHandlers = new Set<MessageHandler>();
  private readonly connHandlers = new Set<ConnHandler>();
  private readonly pending: string[] = [];

  /** True once the handshake has completed. */
  get isConnected(): boolean {
    return this.authenticated && this.ws?.readyState === WebSocket.OPEN;
  }

  connect(connectionId: string, getToken: RelayTokenSource): void {
    if (this.connectionId === connectionId && (this.ws || this.reconnectTimer)) return;
    if (this.connectionId && this.connectionId !== connectionId) this.disconnect();

    this.connectionId = connectionId;
    this.getToken = getToken;
    this.closedByUser = false;
    void this.open();
  }

  disconnect(): void {
    this.closedByUser = true;
    this.connectionId = null;
    this.getToken = null;
    this.stopKeepalive();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.authenticated = false;
    this.pending.length = 0;
    const ws = this.ws;
    this.ws = null;
    ws?.close();
    this.connHandlers.forEach((h) => h(false));
  }

  onMessage(handler: MessageHandler): () => void {
    this.msgHandlers.add(handler);
    return () => this.msgHandlers.delete(handler);
  }

  onConnectionChange(handler: ConnHandler): () => void {
    this.connHandlers.add(handler);
    return () => this.connHandlers.delete(handler);
  }

  /**
   * Send commands to a device. Queued until the handshake finishes, so a
   * screen that acts on mount does not lose its first command.
   */
  sendCommand(deviceId: string, commands: DeviceCommand[], widgetId?: string): void {
    const frame = JSON.stringify({
      targetId: deviceId,
      payload: { ...(widgetId ? { widgetId } : {}), commands },
    });
    if (this.isConnected) this.ws!.send(frame);
    else this.pending.push(frame);
  }

  /**
   * Ask the relay which devices are connected. Answered from the relay's own
   * map, scoped to what this session may see.
   *
   * Never poll a device with DEVICE_STATUS to answer this: that tests whether
   * the firmware is free to reply rather than whether the device is connected,
   * takes seconds, and -- being a command -- needs the `write` grant.
   */
  requestPresence(): void {
    if (this.isConnected) {
      this.ws!.send(JSON.stringify({ hsc: "1", type: "getConnectedDevices" }));
    }
  }

  /** Reconnect now if the socket died while the app was in the background. */
  resume(): void {
    if (this.closedByUser || !this.connectionId) return;
    if (this.isConnected) return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    void this.open();
  }

  private async open(): Promise<void> {
    if (this.closedByUser || !this.connectionId || !this.getToken) return;

    let token: string | null = null;
    try {
      token = await this.getToken();
    } catch {
      token = null;
    }
    if (!token) {
      // No session yet, or the mint failed. Retry on the backoff rather than
      // giving up -- a refresh in flight resolves in a second or two.
      this.scheduleReconnect();
      return;
    }
    if (this.closedByUser) return;

    const url = `wss://${appConfig.relayHost}/?id=${encodeURIComponent(this.connectionId)}`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;
    this.authenticated = false;

    ws.onmessage = (event) => {
      let msg: RealtimeMessage & { type?: string; ts?: number; reason?: string };
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return; // malformed frame
      }

      if (msg.type === "challenge") {
        ws.send(JSON.stringify({ hsc: "1", type: "session", token }));
        return;
      }

      if (msg.type === "auth_ok") {
        this.authenticated = true;
        this.reconnectAttempts = 0;
        this.startKeepalive();
        this.flushPending();
        this.connHandlers.forEach((h) => h(true));
        return;
      }

      /* The relay's application-level keepalive. Answering it is what keeps the
       * connection alive: protocol ping/pong frames do not survive the trip
       * through the proxy once a connection goes quiet, so this reply -- an
       * ordinary data frame -- is the liveness signal that actually arrives.
       * It must never reach the app as device data. */
      if (msg.type === "ping") {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ hsc: "1", type: "pong", ts: msg.ts }));
        }
        return;
      }

      if (msg.type === "auth_fail") {
        // The relay closes the socket itself; the close handler reconnects.
        console.warn("[HSC] auth failed:", msg.reason);
        return;
      }

      if (msg.type === "error") {
        // forbidden / target_offline. Surface for debugging, never as data.
        console.debug("[HSC] relay error:", (msg as { error?: string }).error);
        return;
      }

      if (this.authenticated) this.msgHandlers.forEach((h) => h(msg));
    };

    ws.onclose = () => {
      // A superseded socket closing must not drive the live one's reconnect.
      if (this.ws !== ws) return;
      this.ws = null;
      const wasAuthenticated = this.authenticated;
      this.authenticated = false;
      this.stopKeepalive();
      if (wasAuthenticated) this.connHandlers.forEach((h) => h(false));
      this.scheduleReconnect();
    };

    ws.onerror = () => {
      /* onclose drives the reconnect; acting here too would double-schedule. */
    };
  }

  private scheduleReconnect(): void {
    if (this.closedByUser || this.reconnectTimer || !this.connectionId) return;
    this.reconnectAttempts++;
    const target = Math.min(
      BACKOFF_BASE_MS * 2 ** (this.reconnectAttempts - 1),
      BACKOFF_MAX_MS,
    );
    const delay = target / 2 + Math.random() * target;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.open();
    }, delay);
  }

  private startKeepalive(): void {
    this.stopKeepalive();
    this.keepaliveTimer = setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) return;
      this.ws.send(JSON.stringify({ hsc: "1", type: "ping", ts: Date.now() }));
    }, KEEPALIVE_MS);
  }

  private stopKeepalive(): void {
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
  }

  private flushPending(): void {
    while (this.pending.length && this.isConnected) {
      this.ws!.send(this.pending.shift()!);
    }
  }
}

export const secureRelay = new SecureRelayConnection();
