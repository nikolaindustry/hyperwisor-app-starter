/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HW_API_KEY?: string;
  readonly VITE_HW_SECRET_KEY?: string;
  readonly VITE_HW_API_BASE_URL?: string;
  readonly VITE_HW_REALTIME_URL?: string;
  readonly VITE_HW_PRODUCT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
