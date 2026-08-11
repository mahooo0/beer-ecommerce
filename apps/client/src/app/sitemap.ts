import type { MetadataRoute } from 'next';
import { getAllPostSlugs, getCategories } from '@/lib/blog-api';
import { SITE } from '@/lib/blog-seo';

export const dynamic = 'force-dynamic';

const LOCALES = ['pl', 'uk'] as const;

/** hreflang set (pl/uk + x-default→pl) for a path that is the same slug in both locales. */
function langs(make: (l: 'pl' | 'uk') => string) {
  return { pl: make('pl'), uk: make('uk'), 'x-default': make('pl') };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, categories] = await Promise.all([getAllPostSlugs(), getCategories('pl')]);
  const entries: MetadataRoute.Sitemap = [];

  entries.push({ url: `${SITE}/`, changeFrequency: 'daily', priority: 1 });

  // Blog index in both locales.
  for (const lang of LOCALES) {
    entries.push({
      url: `${SITE}/${lang}/blog`,
      changeFrequency: 'daily',
      priority: 0.7,
      alternates: { languages: langs((l) => `${SITE}/${l}/blog`) },
    });
  }

  // Category listings × locale (slug is not localized).
  for (const cat of categories) {
    if (!cat.slug) continue;
    for (const lang of LOCALES) {
      entries.push({
        url: `${SITE}/${lang}/blog/category/${cat.slug}`,
        changeFrequency: 'weekly',
        priority: 0.5,
        alternates: { languages: langs((l) => `${SITE}/${l}/blog/category/${cat.slug}`) },
      });
    }
  }

  // Posts × locale, with image sitemap extension + hreflang. Guard against absurd counts.
  for (const { slug, updatedAt, image } of slugs.slice(0, 20000)) {
    for (const lang of LOCALES) {
      entries.push({
        url: `${SITE}/${lang}/blog/${slug}`,
        ...(updatedAt ? { lastModified: updatedAt } : {}),
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: { languages: langs((l) => `${SITE}/${l}/blog/${slug}`) },
        ...(image ? { images: [image] } : {}),
      });
    }
  }

  return entries;
}
