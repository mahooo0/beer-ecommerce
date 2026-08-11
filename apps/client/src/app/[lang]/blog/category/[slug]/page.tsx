import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TarankaFooter } from '@/components/taranka/footer';
import { TarankaBlogCard } from '@/components/taranka/blog-card';
import { BlogPagination } from '@/components/taranka/blog-pagination';
import { BlogBreadcrumbs } from '@/components/taranka/blog-breadcrumbs';
import { getCategoryBySlug, getPostsByCategory, isBlogLocale } from '@/lib/blog-api';
import { BLOG_T } from '@/lib/blog-i18n';
import { SITE, INDEXABLE, pageTitle, breadcrumbJsonLd, jsonLdScript } from '@/lib/blog-seo';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

interface Props {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

function parsePage(v: string | undefined): number {
  const n = Number.parseInt(v ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isBlogLocale(lang)) return {};
  const category = await getCategoryBySlug(slug, lang);
  if (!category) return { title: pageTitle(BLOG_T[lang].blog), robots: { index: false, follow: false } };

  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const suffix = page > 1 ? `?page=${page}` : '';
  const name = category.title || slug;
  const url = `${SITE}/${lang}/blog/category/${slug}${suffix}`;

  return {
    title: pageTitle(`${name} — ${BLOG_T[lang].blog}`),
    description: BLOG_T[lang].subtitle,
    robots: INDEXABLE,
    alternates: {
      canonical: url,
      languages: {
        pl: `${SITE}/pl/blog/category/${slug}${suffix}`,
        uk: `${SITE}/uk/blog/category/${slug}${suffix}`,
        'x-default': `${SITE}/pl/blog/category/${slug}${suffix}`,
      },
    },
    openGraph: { title: pageTitle(name), url, type: 'website', siteName: 'Taranka' },
  };
}

export default async function BlogCategoryPage({ params, searchParams }: Props) {
  const { lang, slug } = await params;
  if (!isBlogLocale(lang)) notFound();
  const category = await getCategoryBySlug(slug, lang);
  if (!category) notFound();

  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const t = BLOG_T[lang];
  const name = category.title || slug;

  let posts: Awaited<ReturnType<typeof getPostsByCategory>>['docs'] = [];
  let totalPages = 1;
  try {
    const data = await getPostsByCategory({ categoryId: category.id, locale: lang, page, limit: PAGE_SIZE });
    posts = data.docs;
    totalPages = data.totalPages || 1;
  } catch {
    posts = [];
  }

  const crumbs = [
    { name: t.home, href: '/' },
    { name: t.blog, href: `/${lang}/blog` },
    { name, href: `/${lang}/blog/category/${slug}` },
  ];

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-6 py-12 font-taranka-body lg:px-[120px]">
        <BlogBreadcrumbs items={crumbs} label={t.breadcrumbLabel} />

        <p className="text-sm font-semibold uppercase tracking-wide text-brand-red-500">{t.category}</p>
        <h1 className="mt-1 font-taranka-display text-[48px] font-extrabold uppercase leading-none text-ink-900">{name}</h1>

        {posts.length === 0 ? (
          <p className="mt-12 text-[#6b5750]">{t.empty}</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <TarankaBlogCard key={p.id} post={p} lang={lang} readMore={t.readMore} />
            ))}
          </div>
        )}

        <BlogPagination
          page={page}
          totalPages={totalPages}
          buildHref={(n) => (n <= 1 ? `/${lang}/blog/category/${slug}` : `/${lang}/blog/category/${slug}?page=${n}`)}
          t={t}
        />
      </div>

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
