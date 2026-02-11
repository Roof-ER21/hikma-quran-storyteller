import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    // API keys are now handled server-side via proxy endpoints
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy Gemini API calls to backend
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true
          }
        }
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          // Avoid terser crashes during SW generation
          minify: false,
          includeAssets: [
            'icons/*.svg',
            'icons/*.png'
            // Story audio loaded on-demand via runtime caching (prevents ~100MB precache)
            // See runtimeCaching 'story-audio-cache' below
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
                // Story Audio - Cache on first play (progressive caching)
                // Caches kids/adult story audio as users play them
                // Prevents ~100MB precache, loads only what's needed
                urlPattern: /\/assets\/(?:kids|adult)\/audio\/.*\.mp3$/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'story-audio-cache',
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
                // Kids illustrations - Cache on first view (prevents ~100MB precache)
                urlPattern: /\/assets\/kids\/illustrations\/.*\.(?:png|jpg|webp)$/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'kids-illustrations-cache',
                  expiration: {
                    maxEntries: 200,
                    maxAgeSeconds: 60 * 60 * 24 * 90 // 90 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
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
            // Pre-cache essential files (exclude large illustrations)
            globPatterns: ['**/*.{js,css,html,ico,woff2}', 'icons/*.{png,svg}'],
            globIgnores: ['assets/kids/illustrations/**', 'assets/quran/**'],
            // Skip waiting for faster updates
            skipWaiting: true,
            clientsClaim: true
          },
          devOptions: {
            enabled: true // Enable PWA in development for testing
          }
        })
      ],
      // API keys removed - now handled server-side
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1200,
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        },
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
