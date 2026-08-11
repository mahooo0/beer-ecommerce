import type { MetadataRoute } from 'next';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.taranka.online').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/cart', '/checkout', '/profile', '/orders', '/wishlist'],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
