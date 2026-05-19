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
import type {
  Product,
  Session,
  UserDevice,
  SensorReading,
  CommandPayload,
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
  async scanQr(qrData: string): Promise<{ success: true; product: Product }> {
    if (isMockMode()) return mock.scanQr(qrData);
    return liveRequest("POST", "/onboarding/scan-qr", { qr_data: qrData });
  },
  async onboardDevice(input: {
    user_id: string;
    product_id: string;
    device_name: string;
    device_identifier?: string;
  }): Promise<{ success: true; device: UserDevice }> {
    if (isMockMode()) return mock.onboardDevice(input);
    return liveRequest("POST", "/onboarding/device", input);
  },
  async getUserDevices(userId: string): Promise<{
    success: true;
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
  async sendCommand(deviceId: string, payload: CommandPayload) {
    if (isMockMode()) return mock.sendCommand(deviceId, payload);
    return liveRequest("POST", "/commands/send", {
      device_id: deviceId,
      command_payload: payload,
    });
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
  subscribeTelemetry(
    deviceId: string,
    userId: string,
    onMessage: (reading: SensorReading) => void,
  ): () => void {
    if (isMockMode()) return mock.subscribeTelemetry(deviceId, onMessage);

    const ws = new WebSocket(`${appConfig.realtimeUrl}/?id=${encodeURIComponent(userId)}`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // Platform broadcasts in various shapes. We accept any with device_id matching.
        if (msg?.device_id === deviceId && typeof msg?.value !== "undefined") {
          onMessage({
            device_id: deviceId,
            sensor_name: msg.sensor_name ?? "value",
            value: Number(msg.value),
            unit: msg.unit,
            recorded_at: msg.timestamp ?? new Date().toISOString(),
          });
        }
      } catch {
        /* ignore malformed frames */
      }
    };
    return () => ws.close();
  },
};
