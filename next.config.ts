// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Optional: caching strategy, etc.
});

const nextConfig = {
  reactStrictMode: true,
  // สามารถใส่ config เพิ่มเติมตรงนี้ได้
};

module.exports = withPWA(nextConfig);
