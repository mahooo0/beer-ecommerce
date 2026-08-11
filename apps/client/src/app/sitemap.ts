import type { MetadataRoute } from 'next';
import { getAllPostSlugs } from '@/lib/blog-api';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.taranka.online').replace(/\/$/, '');

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllPostSlugs();
  const entries: MetadataRoute.Sitemap = [];

  entries.push({ url: `${SITE}/`, changeFrequency: 'daily', priority: 1 });

  // Blog index in both locales, cross-linked via hreflang.
  for (const lang of ['pl', 'uk'] as const) {
    entries.push({
      url: `${SITE}/${lang}/blog`,
      changeFrequency: 'daily',
      priority: 0.7,
      alternates: { languages: { pl: `${SITE}/pl/blog`, uk: `${SITE}/uk/blog` } },
    });
  }

  // One entry per (post, locale). Slug is shared across locales.
  for (const { slug, updatedAt } of slugs) {
    for (const lang of ['pl', 'uk'] as const) {
      entries.push({
        url: `${SITE}/${lang}/blog/${slug}`,
        ...(updatedAt ? { lastModified: updatedAt } : {}),
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: { languages: { pl: `${SITE}/pl/blog/${slug}`, uk: `${SITE}/uk/blog/${slug}` } },
      });
    }
  }

  return entries;
}
