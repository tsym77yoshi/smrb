import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite';
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  server: {
    host: true,
  },
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
})
