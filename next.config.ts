/** @type {import('next').NextConfig} */
const nextPWA = require("next-pwa");

const isDev = process.env.NODE_ENV === 'development'; // ใช้สำหรับปิด PWA ในโหมดพัฒนา

const withPWA = nextPWA({
  dest: "public",
  disable: isDev,
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/offline.html', // เพิ่มหน้า offline
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 365 วัน
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "gstatic-fonts-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 365 วัน
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 วัน
        },
      },
    },
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24, // 1 วัน
        },
        networkTimeoutSeconds: 3,
      },
    },
  ],
});

const nextConfig = {
  experimental: {
    turbo: false, // ❗ ปิด Turbopack
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverRuntimeConfig: {
    maxFileSize: 50 * 1024 * 1024, 
  },
  publicRuntimeConfig: {
    maxFileSize: 50 * 1024 * 1024,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'geolocation=*, camera=*, microphone=*, display-capture=*'
          },
          {
            key: 'Feature-Policy',
            value: 'geolocation *; camera *; microphone *'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; connect-src 'self' https: wss: ws:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:;"
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, x-api-key'
          }
        ]
      }
    ];
  },
};

module.exports = withPWA(nextConfig);
