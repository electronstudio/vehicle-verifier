import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/vehicle-verifier/' : '/',
  plugins: [
    solid(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'UK Vehicle Checker',
        short_name: 'Vehicle Check',
        description: 'Check UK vehicle tax and MOT status',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: process.env.NODE_ENV === 'production' ? '/vehicle-verifier/' : '/',
        categories: ['utilities', 'productivity'],
        icons: [
          { 
            src: process.env.NODE_ENV === 'production' ? '/vehicle-verifier/icon-192.png' : '/icon-192.png', 
            sizes: '192x192', 
            type: 'image/png',
            purpose: 'any maskable'
          },
          { 
            src: process.env.NODE_ENV === 'production' ? '/vehicle-verifier/icon-512.png' : '/icon-512.png', 
            sizes: '512x512', 
            type: 'image/png' 
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.workers\.dev/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'worker-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7
              }
            }
          }
        ]
      }
    })
  ]
})
