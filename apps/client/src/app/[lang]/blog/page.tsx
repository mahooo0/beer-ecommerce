import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TarankaFooter } from '@/components/taranka/footer';
import { TarankaBlogCard } from '@/components/taranka/blog-card';
import { BlogPagination } from '@/components/taranka/blog-pagination';
import { BlogSearch } from '@/components/taranka/blog-search';
import { BlogBreadcrumbs } from '@/components/taranka/blog-breadcrumbs';
import { getPosts, searchPosts, isBlogLocale, type BlogLocale } from '@/lib/blog-api';
import { BLOG_T } from '@/lib/blog-i18n';
import { SITE, INDEXABLE, pageTitle, breadcrumbJsonLd, jsonLdScript } from '@/lib/blog-seo';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}

function parsePage(v: string | undefined): number {
  const n = Number.parseInt(v ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isBlogLocale(lang)) return {};
  const { page: pageParam, q } = await searchParams;
  const t = BLOG_T[lang];
  const page = parsePage(pageParam);

  // Search result pages are self-referential but should not be indexed.
  if (q) {
    return {
      title: pageTitle(`${t.searchLabel}: ${q}`),
      description: t.subtitle,
      robots: { index: false, follow: true },
      alternates: { canonical: `${SITE}/${lang}/blog` },
    };
  }

  const suffix = page > 1 ? `?page=${page}` : '';
  const url = `${SITE}/${lang}/blog${suffix}`;
  const title = pageTitle(page > 1 ? `${t.blog} (${page})` : t.blog);
  return {
    title,
    description: t.subtitle,
    robots: INDEXABLE,
    alternates: {
      canonical: url,
      languages: {
        pl: `${SITE}/pl/blog${suffix}`,
        uk: `${SITE}/uk/blog${suffix}`,
        'x-default': `${SITE}/pl/blog${suffix}`,
      },
      types: {
        'application/rss+xml': `${SITE}/${lang}/blog/rss.xml`,
        'application/atom+xml': `${SITE}/${lang}/blog/atom.xml`,
      },
    },
    openGraph: { title, description: t.subtitle, url, type: 'website', siteName: 'Taranka' },
  };
}

export default async function BlogListPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isBlogLocale(lang)) notFound();
  const { page: pageParam, q: rawQ } = await searchParams;
  const t = BLOG_T[lang];
  const q = (rawQ ?? '').trim();
  const page = parsePage(pageParam);

  let posts: Awaited<ReturnType<typeof getPosts>>['docs'] = [];
  let totalPages = 1;
  if (q) {
    posts = await searchPosts(q, lang);
  } else {
    try {
      const data = await getPosts({ locale: lang, limit: PAGE_SIZE, page });
      posts = data.docs;
      totalPages = data.totalPages || 1;
    } catch {
      posts = [];
    }
  }

  const crumbs = [
    { name: t.home, href: '/' },
    { name: t.blog, href: `/${lang}/blog` },
  ];

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle(t.blog),
    url: `${SITE}/${lang}/blog`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.map((p, i) => ({
        '@type': 'ListItem',
        position: (page - 1) * PAGE_SIZE + i + 1,
        url: `${SITE}/${lang}/blog/${p.slug}`,
        name: p.title || undefined,
      })),
    },
  };

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-6 py-12 font-taranka-body lg:px-[120px]">
        <BlogBreadcrumbs items={crumbs} label={t.breadcrumbLabel} />

        <h1 className="font-taranka-display text-[48px] font-extrabold uppercase leading-none text-ink-900">{t.blog}</h1>
        <p className="mt-3 text-[#6b5750]">{t.subtitle}</p>

        <BlogSearch
          lang={lang}
          initialQuery={q}
          placeholder={t.searchPlaceholder}
          label={t.searchLabel}
          submitLabel={t.searchSubmit}
          clearLabel={t.clearSearch}
        />

        {q ? <h2 className="mt-10 text-[20px] font-semibold text-[#443029]">{t.resultsFor(q)}</h2> : null}

        {posts.length === 0 ? (
          <p className="mt-12 text-[#6b5750]">{q ? t.noResults : t.empty}</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <TarankaBlogCard key={p.id} post={p} lang={lang} readMore={t.readMore} />
            ))}
          </div>
        )}

        {!q ? (
          <BlogPagination
            page={page}
            totalPages={totalPages}
            buildHref={(n) => (n <= 1 ? `/${lang}/blog` : `/${lang}/blog?page=${n}`)}
            t={t}
          />
        ) : null}
      </div>

      {!q ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, url: c.href === '/' ? `${SITE}/` : `${SITE}${c.href}` }))))} />
      ) : null}
      {!q && posts.length > 0 ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(itemList)} />
      ) : null}

      <TarankaFooter />
    </>
  );
}
