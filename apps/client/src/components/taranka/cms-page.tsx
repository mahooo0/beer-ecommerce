import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TarankaFooter } from '@/components/taranka/footer';
import { RenderBlocks } from '@/components/taranka/render-blocks';
import { getServerLang } from '@/lib/i18n/server';
import { getPageBySlug, pageOgImageURL, type PageSlug } from '@/lib/pages-api';
import { SITE, INDEXABLE } from '@/lib/blog-seo';

/**
 * Shared renderer for the admin-controlled storefront content pages
 * (About / Delivery / Franchise / Contacts). Content lives in Payload CMS and
 * is authored per-locale; the current language comes from the site cookie
 * (`getServerLang`), consistent with the rest of the storefront.
 */

/** Metadata for a content-page route. Call from the route's `generateMetadata`. */
export async function cmsPageMetadata(slug: PageSlug): Promise<Metadata> {
  const lang = await getServerLang();
  const page = await getPageBySlug(slug, lang).catch(() => null);
  if (!page) return { title: 'Taranka' };

  const title = page.meta?.title || page.title || 'Taranka';
  const description = page.meta?.description || undefined;
  const og = pageOgImageURL(page);
  const url = `${SITE}/${slug}`;
  const noIndex = Boolean(page.meta?.noIndex) || !INDEXABLE;

  return {
    title: `${title} | Taranka`,
    description,
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      ...(og ? { images: [{ url: og }] } : {}),
    },
    twitter: {
      card: og ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(og ? { images: [og] } : {}),
    },
  };
}

/** Server view: fetches the page in the current locale and renders it. */
export async function CmsPageView({ slug }: { slug: PageSlug }) {
  const lang = await getServerLang();
  const page = await getPageBySlug(slug, lang).catch(() => null);
  if (!page) notFound();

  return (
    <>
      <article className="mx-auto max-w-5xl px-4 pb-6 pt-8 md:pt-12">
        {page.title ? (
          <h1 className="font-taranka-display text-[34px] font-extrabold uppercase leading-tight text-ink-900 md:text-[44px]">
            {page.title}
          </h1>
        ) : null}
        <RenderBlocks blocks={page.layout} lang={lang} />
      </article>
      <TarankaFooter />
    </>
  );
}
