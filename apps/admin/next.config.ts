import type { NextConfig } from 'next';

const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:4001';
const storageHostname = new URL(storageUrl).hostname;
const storagePort = new URL(storageUrl).port;

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/types'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: storageHostname,
        port: storagePort,
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
