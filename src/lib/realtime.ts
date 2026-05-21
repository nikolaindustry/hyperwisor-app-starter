/**
 * Realtime connection manager (live mode).
 *
 * One shared WebSocket to the Hyperwisor relay, keyed by the signed-in
 * user id. Used for both directions:
 *   - inbound  : telemetry frames from devices
 *   - outbound : commands to devices
 *
 * Wire format for sending a command (verified against the platform's
 * deviceWebSocketService):
 *   { targetId: "<deviceId>", payload: { commands: [...] } }
 *
 * Mock mode never reaches this file — see src/lib/mock.ts.
 */

import { appConfig } from "@config";
import type { DeviceCommand, RealtimeMessage } from "./types";

type MessageHandler = (msg: RealtimeMessage) => void;

let socket: WebSocket | null = null;
let currentUserId: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const handlers = new Set<MessageHandler>();
const pendingSends: string[] = [];

function flushPending() {
  if (socket?.readyState !== WebSocket.OPEN) return;
  while (pendingSends.length) socket.send(pendingSends.shift()!);
}

function open(userId: string) {
  if (socket && currentUserId === userId &&
      (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }
  currentUserId = userId;
  socket?.close();

  socket = new WebSocket(`${appConfig.realtimeUrl}/?id=${encodeURIComponent(userId)}`);

  socket.onopen = () => flushPending();

  socket.onmessage = (event) => {
    let msg: RealtimeMessage;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return; // ignore malformed frames
    }
    handlers.forEach((h) => h(msg));
  };

  socket.onclose = () => {
    // Reconnect with backoff while a user is still signed in.
    if (currentUserId && !reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (currentUserId) open(currentUserId);
      }, 2000);
    }
  };

  socket.onerror = () => socket?.close();
}

export const realtime = {
  /** Ensure a connection exists for this user. Safe to call repeatedly. */
  connect(userId: string) {
    open(userId);
  },

  /** Tear down the connection (on sign-out). */
  disconnect() {
    currentUserId = null;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    socket?.close();
    socket = null;
  },

  /** Subscribe to all inbound frames. Returns an unsubscribe function. */
  onMessage(handler: MessageHandler): () => void {
    handlers.add(handler);
    return () => handlers.delete(handler);
  },

  /** Send commands to a device. */
  sendCommand(deviceId: string, commands: DeviceCommand[], widgetId?: string) {
    const frame = JSON.stringify({
      targetId: deviceId,
      payload: { ...(widgetId ? { widgetId } : {}), commands },
    });
    if (socket?.readyState === WebSocket.OPEN) socket.send(frame);
    else pendingSends.push(frame); // sent on (re)connect
  },
};
