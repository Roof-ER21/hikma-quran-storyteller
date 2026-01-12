import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          // Avoid terser crashes during SW generation
          minify: false,
          includeAssets: [
            'icons/*.svg',
            'icons/*.png',
            'assets/kids/audio/**/*.mp3',
            // Quran audio loaded on-demand from CDN, not precached (too large ~900MB)
            // 'assets/quran/offline/**/*.mp3',
            'assets/adult/audio/*.mp3'
          ],
          manifest: {
            name: "Alaya & Soad's Gift: Stories from Jannah",
            short_name: "Alaya & Soad",
            description: "A loving tribute bringing Quranic stories to life - in memory of Alaya & Soad",
            theme_color: '#9f1239',
            background_color: '#1e293b',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/icons/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            // Cache strategies
            runtimeCaching: [
              {
                // App Shell - Cache First
                urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                // Quran API - Cache First (30 days)
                urlPattern: /^https:\/\/api\.alquran\.cloud\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'quran-api-cache',
                  expiration: {
                    maxEntries: 200,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                // Quran Audio - Cache on first play (progressive caching)
                // Audio streams from CDN and caches locally as user listens
                // Supports ~20,000 verse files across all reciters
                urlPattern: /^https:\/\/cdn\.islamic\.network\/quran\/audio\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'quran-audio-cache',
                  expiration: {
                    maxEntries: 20000, // All verses across all reciters
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  },
                  rangeRequests: true
                }
              },
              {
                // CDN assets (Tailwind, Font Awesome, etc.)
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'cdn-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                  }
                }
              },
              {
                // Font Awesome CDN
                urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'fontawesome-cache',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                  }
                }
              },
              {
                // Gemini AI API - Network First (always need fresh)
                urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'gemini-api-cache',
                  networkTimeoutSeconds: 10,
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 // 1 hour
                  }
                }
              },
              {
                // Images - Cache First
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'images-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                  }
                }
              }
            ],
            // Pre-cache essential files
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            // Skip waiting for faster updates
            skipWaiting: true,
            clientsClaim: true
          },
          devOptions: {
            enabled: true // Enable PWA in development for testing
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (id.includes('services/geminiService')) return 'ai-gemini';
              if (id.includes('services/audioUtils') || id.includes('services/quranAudioService')) return 'audio-core';
              if (id.includes('node_modules')) return 'vendor';
              return undefined;
            }
          }
        }
      }
    };
});
