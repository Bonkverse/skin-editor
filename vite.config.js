import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import optimizeLocales from '@react-aria/optimize-locales-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // React Aria ships UI strings for 30+ languages; the editor is English-only.
    { ...optimizeLocales.vite({ locales: ['en-US'] }), enforce: 'pre' },
  ],
  server: {
    proxy: {
      "/api": {
        target: "https://bonkverse.io",
        changeOrigin: true,
      },
    },
  },
})
