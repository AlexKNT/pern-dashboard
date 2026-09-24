/// <reference types="vite/client" />

/** The environment variables the web app reads, all public and safe in the bundle. */
interface ImportMetaEnv {
  /** The API base address the data provider and auth provider call. */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
