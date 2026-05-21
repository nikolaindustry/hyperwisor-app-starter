/**
 * The single SDK facade used everywhere in the app.
 *
 * - In MOCK mode (no real API keys), routes everything to ./mock.ts.
 * - In LIVE mode, forwards to the Hyperwisor manufacturer API.
 *
 * Screens only depend on this file. Swapping mock ↔ live is invisible
 * to the rest of the app.
 */

import { appConfig, isMockMode } from "@config";
import { mock } from "./mock";
import { realtime } from "./realtime";
import type {
  Product,
  Session,
  UserDevice,
  SensorReading,
  DeviceCommand,
} from "./types";

type RequestInitWithAuth = RequestInit & { authToken?: string };

async function liveRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  init: RequestInitWithAuth = {},
): Promise<T> {
  const url = `${appConfig.apiBaseUrl}/manufacturer-api${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": appConfig.apiKey,
    "x-secret-key": appConfig.secretKey,
  };
  if (init.authToken) headers.Authorization = `Bearer ${init.authToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(json?.error || json?.message || `HTTP ${res.status}`);
  return json as T;
}

export const sdk = {
  isMock: isMockMode(),

  // --- Auth ---
  async signUp(input: { email: string; password: string; name?: string }) {
    if (isMockMode()) return mock.signUp(input.email, input.password, input.name);
    return liveRequest("POST", "/auth/signup", input);
  },
  async signIn(input: { email: string; password: string }): Promise<{
    success: boolean;
    session: Session;
    user: { id: string; email: string; name?: string };
  }> {
    if (isMockMode()) return mock.signIn(input.email, input.password);
    return liveRequest("POST", "/auth/signin", input);
  },
  async signOut(token?: string) {
    if (isMockMode()) return mock.signOut();
    return liveRequest("POST", "/auth/signout", {}, { authToken: token });
  },
  async resetPassword(email: string) {
    if (isMockMode()) return mock.resetPassword(email);
    return liveRequest("POST", "/auth/reset-password", { email });
  },
  async verifyToken(token: string) {
    if (isMockMode()) return mock.verifyToken();
    return liveRequest("POST", "/auth/verify", {}, { authToken: token });
  },

  // --- Onboarding ---
  async scanQr(qrData: string): Promise<{ success: boolean; product: Product }> {
    if (isMockMode()) return mock.scanQr(qrData);
    return liveRequest("POST", "/onboarding/scan-qr", { qr_data: qrData });
  },
  async onboardDevice(input: {
    user_id: string;
    product_id: string;
    device_name: string;
    device_identifier?: string;
  }): Promise<{ success: boolean; device: UserDevice }> {
    if (isMockMode()) return mock.onboardDevice(input);
    return liveRequest("POST", "/onboarding/device", input);
  },
  async getUserDevices(userId: string): Promise<{
    success: boolean;
    devices: UserDevice[];
    count: number;
  }> {
    if (isMockMode()) return mock.getUserDevices();
    return liveRequest("GET", `/onboarding/user/${userId}/devices`);
  },
  async removeDevice(deviceId: string, userId: string) {
    if (isMockMode()) return mock.removeDevice(deviceId);
    return liveRequest(
      "DELETE",
      `/onboarding/device/${deviceId}?user_id=${encodeURIComponent(userId)}`,
    );
  },

  // --- Commands & telemetry ---
  /**
   * Send commands to a device. `commands` uses the real Hyperwisor
   * protocol — see DeviceCommand in types.ts. Example:
   *   sdk.sendCommand(deviceId, [
   *     { command: "setPower", actions: [{ action: "turnOn", params: { outletId: "0" } }] }
   *   ]);
   */
  async sendCommand(deviceId: string, commands: DeviceCommand[], widgetId?: string) {
    if (isMockMode()) return mock.sendCommand(deviceId, commands);
    realtime.sendCommand(deviceId, commands, widgetId);
    return { success: true, device_id: deviceId, timestamp: new Date().toISOString() };
  },
  async getSensorData(deviceId: string): Promise<{ success: true; data: SensorReading[] }> {
    if (isMockMode()) return mock.getSensorData(deviceId);
    const r = await liveRequest<{ success: true; sensor_data: SensorReading[] }>(
      "GET",
      `/sensor-data?device_id=${encodeURIComponent(deviceId)}`,
    );
    return { success: true, data: r.sensor_data ?? [] };
  },

  // --- Realtime ---
  /** Open/refresh the realtime connection for a user. Called by AuthProvider. */
  connectRealtime(userId: string) {
    if (!isMockMode()) realtime.connect(userId);
  },
  disconnectRealtime() {
    if (!isMockMode()) realtime.disconnect();
  },

  /**
   * Subscribe to telemetry for one device. The handler fires whenever a
   * frame for `deviceId` arrives. Returns an unsubscribe function.
   */
  subscribeTelemetry(
    deviceId: string,
    userId: string,
    onMessage: (reading: SensorReading) => void,
  ): () => void {
    if (isMockMode()) return mock.subscribeTelemetry(deviceId, onMessage);

    realtime.connect(userId);
    return realtime.onMessage((msg) => {
      // Accept frames addressed to this device with a numeric value.
      if (msg?.device_id === deviceId && msg.value !== undefined) {
        onMessage({
          device_id: deviceId,
          sensor_name: msg.sensor_name ?? "value",
          value: Number(msg.value),
          unit: msg.unit,
          recorded_at: msg.timestamp ?? new Date().toISOString(),
        });
      }
    });
  },
};
