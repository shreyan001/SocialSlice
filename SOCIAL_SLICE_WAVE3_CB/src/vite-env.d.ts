/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TESTNET_WEB3AUTH_ID: string
    readonly VITE_GOOGLE_CLIENT_ID: string
    readonly VITE_TESTNET_PAYMASTER_API: string
    readonly VITE_MAINNET_WEB3AUTH_ID: string
    readonly VITE_MAINNET_PAYMASTER_API: string
    readonly VITE_FACEBOOK_CLIENT_ID: string
    // add more as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  