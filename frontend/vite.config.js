import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Update Type: 'prompt' as requested
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/ios/180.png'], // Add basic icons for pre-caching
      manifest: {
        name: 'WIET Attendance Management System',
        short_name: 'WIET Attend',
        description: 'Complete attendance management system for WIET College',
        theme_color: '#4F46E5',
        background_color: '#4F46E5',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/android/launchericon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable' // PWABuilder default can act as maskable
          },
          {
            src: '/icons/android/launchericon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache static files only
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // ❌ NEVER CACHE (NetworkOnly)
          {
            urlPattern: /\/api\/(attendance\/(mark-and-generate|update|history)|admin\/(students|batches|upload-.*)|teacher\/dashboard-stats|proxy|auth)/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'never-cache',
            }
          },
          // ✅ SAFE TO CACHE - Rarely changes (CacheFirst)
          {
            urlPattern: /\/api\/(branches|subjects)/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              }
            }
          },
          // ✅ SAFE TO CACHE - Often changes (NetworkFirst, fallback to cache)
          {
            urlPattern: /\/api\/teacher\/my-assignments/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'assignments-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    strictPort: false,
  },
})
