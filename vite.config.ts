import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// `VITE_BASE` permite publicar bajo /nombre-del-repositorio/ en GitHub Pages
// sin hardcodear el nombre. En local queda en la raiz.
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      // `autoUpdate` evita que una pestaña quede atrapada en un build viejo:
      // el service worker nuevo toma el control y la próxima recarga ya trae
      // la versión publicada, sin exigir pulsar un aviso.
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: false, // usamos public/manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\/audio\/samples\/.*\.(mp3|m4a|ogg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-samples',
              expiration: {
                maxEntries: 64,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    // VexFlow es un chunk diferido grande por diseño: solo se descarga al
    // dibujar el pentagrama. El presupuesto real lo valida scripts/check-bundle.mjs.
    chunkSizeWarningLimit: 1200,
  },
})
