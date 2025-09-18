/** @type {import('next').NextConfig} */
const nextPWA = require("next-pwa");

const isDev = process.env.NODE_ENV === 'development';

const withPWA = nextPWA({
  dest: "public",
  disable: isDev,
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
});

const nextConfig = {
  experimental: {
    appDir: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // ปิดการตรวจ ESLint ตอน build
  },
  serverRuntimeConfig: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  publicRuntimeConfig: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  // เพิ่ม headers สำหรับ GPS permission
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Permissions Policy สำหรับ Geolocation
          {
            key: 'Permissions-Policy',
            value: 'geolocation=*, camera=*, microphone=*, display-capture=*'
          },
          // Feature Policy (สำหรับ browser เก่า)
          {
            key: 'Feature-Policy',
            value: 'geolocation *; camera *; microphone *'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; connect-src 'self' https: wss: ws:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:;"
          },
          // Cross-Origin Embedder Policy
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless'
          },
          // Cross-Origin Opener Policy  
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          },
        ],
      },
      // เฉพาะสำหรับ API routes
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
