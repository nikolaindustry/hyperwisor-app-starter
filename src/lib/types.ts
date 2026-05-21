/**
 * Shared types matching Hyperwisor manufacturer API shapes.
 * See SDKs/javascript/hyperwisor-iot-sdk/src/index.d.ts for full SDK types.
 */

export type User = {
  id: string;
  email: string;
  name?: string;
};

export type Session = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: User;
};

export type Product = {
  id: string;
  product_name: string;
  product_category?: string;
  product_description?: string;
  model_number?: string;
  firmware_version?: string;
  product_image?: string;
  manufacturer_id?: string;
  is_public?: boolean;
  product_commands?: ProductCommand[];
};

export type ActionParameter = {
  id: string;
  name: string;
  type: "boolean" | "number" | "string" | "enum";
  default_value?: string | number | boolean;
  min?: number;
  max?: number;
  options?: string[];
};

export type CommandAction = {
  id: string;
  action_name: string;
  action_parameters?: ActionParameter[];
};

export type ProductCommand = {
  id: string;
  command_name: string;
  command_description?: string;
  command_actions?: CommandAction[];
};

export type UserDevice = {
  id: string;
  user_id: string;
  product_id: string;
  device_name: string;
  device_identifier?: string | null;
  is_active: boolean;
  is_online?: boolean;
  last_seen?: string | null;
  created_at: string;
  iot_products?: Product;
};

export type SensorReading = {
  device_id: string;
  sensor_name: string;
  value: number;
  unit?: string;
  recorded_at: string;
};

/**
 * Hyperwisor device command protocol.
 *
 * Commands are sent over the realtime WebSocket as:
 *   { targetId: "<deviceId>", payload: { commands: DeviceCommand[] } }
 *
 * This is the real wire format used by the platform — verified against
 * deviceWebSocketService and the dashboard widget event vocabulary.
 */
export type CommandParams = Record<string, string | number | boolean>;

export type DeviceAction = {
  action: string;
  params?: CommandParams;
};

export type DeviceCommand = {
  command: string;
  actions: DeviceAction[];
};

/** Incoming telemetry frame from the realtime relay. */
export type RealtimeMessage = {
  widgetId?: string;
  device_id?: string;
  sensor_name?: string;
  value?: number | string | boolean;
  unit?: string;
  timestamp?: string;
  [key: string]: unknown;
};

export type QrCodeData = {
  productId: string;
  deviceId?: string;
  manufacturer?: string;
  model?: string;
  metadata?: Record<string, unknown>;
};
