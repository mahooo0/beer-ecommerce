import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/types', '@repo/db'],
  images: {
    remotePatterns: [
      { protocol: 'https' as const, hostname: 'res.cloudinary.com' },
      { protocol: 'https' as const, hostname: 'loremflickr.com' },
      { protocol: 'https' as const, hostname: 'picsum.photos' },
      { protocol: 'https' as const, hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
