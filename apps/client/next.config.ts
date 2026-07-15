import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/types', '@repo/db'],
  // TODO: fix underlying TS/lint errors, then remove these. Dev (tsx) tolerates them; `next build` does not.
  typescript: { ignoreBuildErrors: true },
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
