/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SENDGRID_API_KEY: string;
  readonly VITE_SENDER_EMAIL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
