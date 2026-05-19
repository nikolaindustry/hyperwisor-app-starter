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

export type CommandPayload = {
  command_id?: string;
  action_id?: string;
  parameters?: Record<string, string | number | boolean>;
};

export type QrCodeData = {
  productId: string;
  deviceId?: string;
  manufacturer?: string;
  model?: string;
  metadata?: Record<string, unknown>;
};
