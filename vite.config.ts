import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    // Node binds `localhost` to IPv6 (::1) only on this machine.
    // Chrome/Safari often connect to 127.0.0.1, which then fails.
    host: '127.0.0.1',
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      html2canvas: fileURLToPath(new URL('./src/reports/empty.ts', import.meta.url)),
      dompurify: fileURLToPath(new URL('./src/reports/empty.ts', import.meta.url)),
      canvg: fileURLToPath(new URL('./src/reports/empty.ts', import.meta.url)),
    },
  },
})
