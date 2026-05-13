import type { NextConfig } from "next";

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: '*.railway.app' },
      { protocol: 'https', hostname: '*.up.railway.app' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${BACKEND}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

