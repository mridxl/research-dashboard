import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/** Reject empty/offline error responses so repeat offline runs are not poisoned. */
const rejectEmptyResponsePlugin = {
  cacheWillUpdate: async ({ response }: { response: Response | undefined }) => {
    if (!response?.ok) return null;
    const contentLength = response.headers.get('Content-Length');
    if (contentLength !== null) {
      const size = Number(contentLength);
      if (!Number.isNaN(size)) {
        return size > 0 ? response : null;
      }
    }
    const size = (await response.clone().blob()).size;
    return size > 0 ? response : null;
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.png',
        'dog_bark.wav',
        'js/framebust.js',
        'models/tiny_face_detector_model-weights_manifest.json',
        'models/tiny_face_detector_model.bin',
        'models/face_landmark_68_tiny_model-weights_manifest.json',
        'models/face_landmark_68_tiny_model.bin',
      ],
      manifest: {
        name: 'Aignosis Research Dashboard',
        short_name: 'Aignosis Research',
        description: 'Research screening dashboard with offline-first test capture',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Main bundle exceeds Workbox default 2 MiB precache limit
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Include model weights + instruction media in precache for offline tests
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webp,gif,mp3,wav,woff2,bin,json}',
        ],
        navigateFallbackDenylist: [/^\/models\//, /\.bin$/, /\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-assets',
              expiration: {
                maxEntries: 120,
              },
              cacheableResponse: {
                statuses: [200],
              },
              plugins: [rejectEmptyResponsePlugin],
            },
          },
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && (url.pathname === '/favicon.png' || url.pathname === '/dog_bark.wav'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'offline-test-assets',
              expiration: {
                maxEntries: 10,
              },
              cacheableResponse: {
                statuses: [200],
              },
              plugins: [rejectEmptyResponsePlugin],
            },
          },
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && url.pathname.includes('/models/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'face-api-models',
              expiration: {
                maxEntries: 20,
              },
              cacheableResponse: {
                statuses: [200],
              },
              plugins: [rejectEmptyResponsePlugin],
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname === 'aignosis-test-videos.storage.googleapis.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'hls-stimulus-videos',
              cacheableResponse: {
                statuses: [200],
              },
              plugins: [rejectEmptyResponsePlugin],
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
