import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // ✅ ไม่ให้ build ล้มถ้าเจอ ESLint error
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
