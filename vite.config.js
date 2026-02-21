import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { BONKVERSE_BASE_URL } from "../config/env";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: BONKVERSE_BASE_URL,
        changeOrigin: true,
      },
    },
  },
})
