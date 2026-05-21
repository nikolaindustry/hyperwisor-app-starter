/**
 * Mock backend used when app.config.ts has no real API keys.
 *
 * Lets manufacturers run `npm run dev` and immediately see a working
 * app with fake data, before they wire up real credentials.
 */

import type {
  Product,
  Session,
  UserDevice,
  SensorReading,
  QrCodeData,
} from "./types";

const DEMO_PRODUCT: Product = {
  id: "demo-product-001",
  product_name: "Smart Thermostat",
  product_category: "HVAC",
  product_description: "WiFi-enabled smart thermostat with energy reporting",
  model_number: "ST-2000",
  firmware_version: "1.4.2",
  product_image: "",
  manufacturer_id: "demo-mfr",
  is_public: true,
  product_commands: [
    {
      id: "cmd-power",
      command_name: "Power",
      command_description: "Turn device on or off",
      command_actions: [
        {
          id: "act-power",
          action_name: "set_power",
          action_parameters: [
            { id: "p1", name: "state", type: "boolean", default_value: false },
          ],
        },
      ],
    },
    {
      id: "cmd-temp",
      command_name: "Target Temperature",
      command_description: "Set the target temperature in °C",
      command_actions: [
        {
          id: "act-temp",
          action_name: "set_target_temp",
          action_parameters: [
            {
              id: "p2",
              name: "temperature",
              type: "number",
              default_value: 22,
              min: 10,
              max: 30,
            },
          ],
        },
      ],
    },
    {
      id: "cmd-mode",
      command_name: "Mode",
      command_description: "Heating / cooling / auto",
      command_actions: [
        {
          id: "act-mode",
          action_name: "set_mode",
          action_parameters: [
            {
              id: "p3",
              name: "mode",
              type: "enum",
              default_value: "auto",
              options: ["heat", "cool", "auto", "off"],
            },
          ],
        },
      ],
    },
  ],
};

let mockSession: Session | null = null;
const mockUsers: Record<string, { password: string; name?: string }> = {
  "demo@hyperwisor.com": { password: "demo1234", name: "Demo User" },
};
let mockDevices: UserDevice[] = [
  {
    id: "device-001",
    user_id: "demo-user",
    product_id: DEMO_PRODUCT.id,
    device_name: "Living Room Thermostat",
    device_identifier: "TH-A1B2C3",
    is_active: true,
    is_online: true,
    last_seen: new Date().toISOString(),
    created_at: new Date(Date.now() - 86_400_000 * 3).toISOString(),
    iot_products: DEMO_PRODUCT,
  },
  {
    id: "device-002",
    user_id: "demo-user",
    product_id: DEMO_PRODUCT.id,
    device_name: "Bedroom Thermostat",
    device_identifier: "TH-D4E5F6",
    is_active: true,
    is_online: false,
    last_seen: new Date(Date.now() - 3_600_000 * 5).toISOString(),
    created_at: new Date(Date.now() - 86_400_000 * 7).toISOString(),
    iot_products: DEMO_PRODUCT,
  },
  {
    // A device whose product has NO bespoke screen registered — shows the
    // "No dashboard yet" state, so the starter demonstrates both paths.
    id: "device-003",
    user_id: "demo-user",
    product_id: "demo-air-quality-002",
    device_name: "Hallway Air Monitor",
    device_identifier: "AQ-X1Y2Z3",
    is_active: true,
    is_online: true,
    last_seen: new Date().toISOString(),
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
    iot_products: {
      id: "demo-air-quality-002",
      product_name: "Air Quality Monitor",
      product_category: "smart_home",
      product_description: "Indoor air quality sensor",
      model_number: "AQ-100",
      firmware_version: "1.0.0",
      is_public: true,
    },
  },
];

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

export const mock = {
  // --- Auth ---
  async signUp(email: string, password: string, name?: string) {
    if (mockUsers[email]) throw new Error("User already exists");
    mockUsers[email] = { password, name };
    return delay({ success: true, user: { id: "demo-user", email, name } });
  },
  async signIn(email: string, password: string) {
    const u = mockUsers[email];
    if (!u || u.password !== password) {
      await delay(null, 400);
      throw new Error("Invalid email or password");
    }
    mockSession = {
      access_token: `mock-token-${Date.now()}`,
      refresh_token: `mock-refresh-${Date.now()}`,
      expires_at: Date.now() + 3_600_000,
      user: { id: "demo-user", email, name: u.name },
    };
    return delay({ success: true, session: mockSession, user: mockSession.user });
  },
  async signOut() {
    mockSession = null;
    return delay({ success: true });
  },
  async resetPassword(_email: string) {
    return delay({ success: true, message: "Reset email sent (mock)" });
  },
  async verifyToken() {
    if (!mockSession) throw new Error("No session");
    return delay({ success: true, user: mockSession.user });
  },

  // --- Onboarding ---
  async scanQr(qrData: string) {
    let parsed: QrCodeData;
    try {
      parsed = JSON.parse(qrData);
    } catch {
      throw new Error("Invalid QR code");
    }
    if (!parsed.productId) throw new Error("QR missing product ID");
    return delay({
      success: true,
      product: { ...DEMO_PRODUCT, qr_info: parsed },
    });
  },
  async onboardDevice(input: {
    user_id: string;
    product_id: string;
    device_name: string;
    device_identifier?: string;
  }) {
    if (mockDevices.some((d) => d.device_name === input.device_name)) {
      throw new Error("A device with this name already exists");
    }
    const newDevice: UserDevice = {
      id: `device-${Date.now()}`,
      user_id: input.user_id,
      product_id: input.product_id,
      device_name: input.device_name,
      device_identifier: input.device_identifier ?? null,
      is_active: true,
      is_online: true,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
      iot_products: DEMO_PRODUCT,
    };
    mockDevices = [newDevice, ...mockDevices];
    return delay({ success: true, device: newDevice });
  },
  async getUserDevices() {
    return delay({ success: true, devices: mockDevices, count: mockDevices.length });
  },
  async removeDevice(deviceId: string) {
    mockDevices = mockDevices.filter((d) => d.id !== deviceId);
    return delay({ success: true });
  },

  // --- Commands ---
  async sendCommand(deviceId: string, _payload: unknown) {
    return delay({
      success: true,
      device_id: deviceId,
      timestamp: new Date().toISOString(),
    });
  },

  // --- Sensor data ---
  async getSensorData(deviceId: string): Promise<{ success: true; data: SensorReading[] }> {
    const now = Date.now();
    const data: SensorReading[] = Array.from({ length: 24 }).map((_, i) => ({
      device_id: deviceId,
      sensor_name: "temperature",
      value: 20 + Math.sin(i / 3) * 2 + Math.random(),
      unit: "°C",
      recorded_at: new Date(now - (23 - i) * 3_600_000).toISOString(),
    }));
    return delay({ success: true, data });
  },

  // --- Realtime simulator (yields a stream of fake telemetry) ---
  subscribeTelemetry(
    deviceId: string,
    onMessage: (reading: SensorReading) => void,
  ): () => void {
    const id = setInterval(() => {
      onMessage({
        device_id: deviceId,
        sensor_name: "temperature",
        value: 21 + Math.random() * 2,
        unit: "°C",
        recorded_at: new Date().toISOString(),
      });
    }, 2500);
    return () => clearInterval(id);
  },

  getDemoProduct(): Product {
    return DEMO_PRODUCT;
  },
};
