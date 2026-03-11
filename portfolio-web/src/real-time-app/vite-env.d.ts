/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HEYGEN_API_TOKEN: string
  readonly WEBHOOK_N8N_REALISTIC_AVATAR: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
