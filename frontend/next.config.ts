import type { NextConfig } from "next";

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

const nextConfig: NextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com', 'github.com', 'localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND}/api/:path*`,
      },
      {
        // Proxy uploaded files from Next.js → NestJS backend
        source: '/uploads/:path*',
        destination: `${BACKEND}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

