import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

const nextConfig: NextConfig = {
  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [100],
    remotePatterns: [
      // Allow the Payload server URL and the public MinIO/S3 host (media is served
      // directly from `${S3_ENDPOINT}/${bucket}/...`).
      ...[NEXT_PUBLIC_SERVER_URL, process.env.S3_ENDPOINT, process.env.S3_PUBLIC_URL]
        .filter((item): item is string => Boolean(item))
        .map((item) => {
          const url = new URL(item)

          return {
            hostname: url.hostname,
            protocol: url.protocol.replace(':', '') as 'http' | 'https',
          }
        }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
  // DEV server runs a production build (`next start`) for a stable admin — don't let
  // pre-existing lint/type noise from the template block the build.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
