/** @type {import('next').NextConfig} */
const nextPWA = require("next-pwa");

const isDev = process.env.NODE_ENV === 'development';

const withPWA = nextPWA({
  dest: "public",
  disable: isDev,
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  experimental: {
    appDir: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // ปิดการตรวจ ESLint ตอน build
  },
};

module.exports = withPWA(nextConfig);
