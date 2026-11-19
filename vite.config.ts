import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages project site: https://uracilo.github.io/DolphinPulse-pwa/
// Local: VITE_BASE_PATH=/ npm run build  ·  dev uses "/" by default
const base =
  process.env.VITE_BASE_PATH ??
  (process.env.NODE_ENV === 'production' ? '/DolphinPulse-pwa/' : '/');

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      minify: false,
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'DolphinPulse',
        short_name: 'DolphinPulse',
        description:
          'Escucha controles Proteco 433.92 MHz desde Flipper Zero por BLE en tiempo real.',
        theme_color: '#0b3a4a',
        background_color: '#06232e',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: base,
        scope: base,
        lang: 'es',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        mode: 'development',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
});
