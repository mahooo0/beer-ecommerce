import type { MetadataRoute } from 'next';
import { SITE, IS_PROD_HOST } from '@/lib/blog-seo';

export default function robots(): MetadataRoute.Robots {
  // DEV / staging (any non-prod host): block all crawling so preview envs never rank.
  if (!IS_PROD_HOST) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/next/preview',
        '/next/exit-preview',
        '/cart',
        '/checkout',
        '/profile',
        '/orders',
        '/wishlist',
        '/*?draft=',
        '/*?preview=',
      ],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
