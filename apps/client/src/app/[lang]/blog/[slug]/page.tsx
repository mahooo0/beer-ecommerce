import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { draftMode } from 'next/headers';
import Link from 'next/link';
import { TarankaFooter } from '@/components/taranka/footer';
import { RichText } from '@/components/taranka/rich-text';
import { RelatedPosts } from '@/components/taranka/related-posts';
import { BlogBreadcrumbs } from '@/components/taranka/blog-breadcrumbs';
import {
  getPostBySlug,
  getAdjacentPosts,
  isBlogLocale,
  postImageURL,
  postOgImage,
  postExcerpt,
  formatBlogDate,
  readingTime,
  lexicalToPlain,
  OG_LOCALE,
  type BlogLocale,
  type RelatedPost,
} from '@/lib/blog-api';
import { BLOG_T } from '@/lib/blog-i18n';
import { SITE, INDEXABLE, ORG_LOGO, FALLBACK_OG, pageTitle, breadcrumbJsonLd, jsonLdScript } from '@/lib/blog-seo';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

/** Strip any CMS/template title suffix so we can apply our own "| Taranka". */
function cleanTitle(s: string): string {
  return s.replace(/\s*\|\s*(Payload Website Template|Taranka)\s*$/i, '').trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isBlogLocale(lang)) return {};
  const { isEnabled: isDraft } = await draftMode();
  const post = await getPostBySlug(slug, lang, { draft: isDraft }).catch(() => null);
  if (!post) return { title: 'Taranka', robots: { index: false, follow: false } };

  const rawTitle = cleanTitle(post.meta?.title || post.title || 'Taranka');
  const description = postExcerpt(post, 160);
  const og = postOgImage(post);
  const url = `${SITE}/${lang}/blog/${slug}`;
  const authors = (post.populatedAuthors || []).map((a) => a?.name).filter(Boolean) as string[];
  const categoryTitles = (post.categories || []).map((c) => c?.title).filter(Boolean) as string[];
  const noIndex = isDraft || post.meta?.noIndex === true;

  const ogImages = og
    ? [{ url: og.url, width: og.width, height: og.height, alt: og.alt || rawTitle }]
    : [{ url: FALLBACK_OG, alt: 'Taranka' }];

  return {
    title: pageTitle(rawTitle),
    description,
    robots: noIndex ? { index: false, follow: false } : INDEXABLE,
    alternates: noIndex
      ? {}
      : {
          canonical: url,
          languages: {
            pl: `${SITE}/pl/blog/${slug}`,
            uk: `${SITE}/uk/blog/${slug}`,
            'x-default': `${SITE}/pl/blog/${slug}`,
          },
          types: {
            'application/rss+xml': `${SITE}/${lang}/blog/rss.xml`,
          },
        },
    openGraph: {
      title: rawTitle,
      description,
      url,
      type: 'article',
      siteName: 'Taranka',
      locale: OG_LOCALE[lang],
      alternateLocale: OG_LOCALE[lang === 'pl' ? 'uk' : 'pl'],
      images: ogImages,
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || post.publishedAt || undefined,
      authors: authors.length ? authors : undefined,
      section: categoryTitles[0] || undefined,
      tags: categoryTitles.length ? categoryTitles : undefined,
    },
    twitter: {
      card: og ? 'summary_large_image' : 'summary',
      title: rawTitle,
      description,
      images: og ? [og.url] : [FALLBACK_OG],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isBlogLocale(lang)) notFound();

  const { isEnabled: isDraft } = await draftMode();
  const post = await getPostBySlug(slug, lang, { draft: isDraft }).catch(() => null);
  if (!post) notFound();

  const t = BLOG_T[lang];
  const hero = postImageURL(post);
  const authors = (post.populatedAuthors || []).map((a) => a?.name).filter(Boolean) as string[];
  const authorLine = authors.join(', ');
  const categories = (post.categories || []).filter((c) => c && c.title);
  const primaryCategory = categories[0];
  const og = postOgImage(post);
  const mins = readingTime(post.content);
  const wordCount = lexicalToPlain(post.content).split(/\s+/).filter(Boolean).length;
  const url = `${SITE}/${lang}/blog/${slug}`;

  const related = (post.relatedPosts || []).filter(
    (r): r is RelatedPost => !!r && typeof r === 'object',
  );
  const { prev, next } = await getAdjacentPosts(post.publishedAt, lang).catch(() => ({ prev: null, next: null }));

  const crumbs = [
    { name: t.home, href: '/' },
    { name: t.blog, href: `/${lang}/blog` },
    ...(primaryCategory?.slug
      ? [{ name: primaryCategory.title as string, href: `/${lang}/blog/category/${primaryCategory.slug}` }]
      : []),
    { name: post.title || slug, href: `/${lang}/blog/${slug}` },
  ];

  const blogPosting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title || undefined,
    description: postExcerpt(post, 200),
    ...(og ? { image: { '@type': 'ImageObject', url: og.url, width: og.width, height: og.height } } : {}),
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt || post.publishedAt || undefined,
    inLanguage: lang === 'uk' ? 'uk-UA' : 'pl-PL',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: authors.length
      ? authors.map((n) => ({ '@type': 'Person', name: n }))
      : { '@type': 'Organization', name: 'Taranka' },
    publisher: {
      '@type': 'Organization',
      name: 'Taranka',
      logo: { '@type': 'ImageObject', url: ORG_LOGO },
    },
    ...(categories[0]?.title ? { articleSection: categories[0].title } : {}),
    ...(categories.length ? { keywords: categories.map((c) => c.title).join(', ') } : {}),
    wordCount,
  };

  return (
    <>
      <article className="mx-auto max-w-[820px] px-6 py-12 font-taranka-body md:px-8">
        <BlogBreadcrumbs items={crumbs} label={t.breadcrumbLabel} />

        <Link href={`/${lang}/blog`} className="text-sm font-semibold text-brand-red-500">
          {t.back}
        </Link>

        <h1 className="mt-6 font-taranka-display text-[40px] font-extrabold uppercase leading-tight text-ink-900">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#6b5750]">
          {post.publishedAt ? <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time> : null}
          <span>· {t.minRead(mins)}</span>
          {categories.map((c) =>
            c.slug ? (
              <Link
                key={c.id}
                href={`/${lang}/blog/category/${c.slug}`}
                className="rounded-full bg-black/5 px-3 py-1 transition-colors hover:bg-brand-red-500 hover:text-white"
              >
                {c.title}
              </Link>
            ) : (
              <span key={c.id} className="rounded-full bg-black/5 px-3 py-1">
                {c.title}
              </span>
            ),
          )}
          {authorLine ? (
            <span>
              {t.author}: {authorLine}
            </span>
          ) : null}
        </div>

        {hero ? (
          <div className="mt-8 overflow-hidden rounded-[24px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero}
              alt={post.heroImage?.alt || post.title || ''}
              width={post.heroImage?.width || undefined}
              height={post.heroImage?.height || undefined}
              fetchPriority="high"
              className="w-full object-cover"
            />
          </div>
        ) : null}

        <div className="mt-10">
          <RichText data={post.content} lang={lang} />
        </div>

        {/* prev / next navigation */}
        {prev || next ? (
          <nav className="mt-14 flex items-stretch justify-between gap-4 border-t border-black/10 pt-8">
            {next ? (
              <Link href={`/${lang}/blog/${next.slug}`} className="group max-w-[48%] text-left">
                <span className="text-xs uppercase tracking-wide text-[#6b5750]">← {t.newer}</span>
                <span className="mt-1 block font-semibold text-[#443029] transition-colors group-hover:text-brand-red-500">
                  {next.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {prev ? (
              <Link href={`/${lang}/blog/${prev.slug}`} className="group ml-auto max-w-[48%] text-right">
                <span className="text-xs uppercase tracking-wide text-[#6b5750]">{t.older} →</span>
                <span className="mt-1 block font-semibold text-[#443029] transition-colors group-hover:text-brand-red-500">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}

        <RelatedPosts posts={related} lang={lang} title={t.related} />
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(blogPosting)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, url: c.href === '/' ? `${SITE}/` : `${SITE}${c.href}` }))),
        )}
      />
      <TarankaFooter />
    </>
  );
}
