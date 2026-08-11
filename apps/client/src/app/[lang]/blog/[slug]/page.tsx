import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TarankaFooter } from '@/components/taranka/footer';
import { RichText } from '@/components/taranka/rich-text';
import {
  getPostBySlug,
  isBlogLocale,
  postImageURL,
  postOgImageURL,
  postExcerpt,
  formatBlogDate,
  type BlogLocale,
} from '@/lib/blog-api';

export const dynamic = 'force-dynamic';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.taranka.online').replace(/\/$/, '');

const UI: Record<BlogLocale, { back: string; by: string }> = {
  pl: { back: '← Wróć na blog', by: 'Autor' },
  uk: { back: '← Назад до блогу', by: 'Автор' },
};

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isBlogLocale(lang)) return {};
  const post = await getPostBySlug(slug, lang).catch(() => null);
  if (!post) return { title: 'Taranka' };

  const title = post.meta?.title || post.title || 'Taranka';
  const description = postExcerpt(post, 160);
  const og = postOgImageURL(post);
  const url = `${SITE}/${lang}/blog/${slug}`;

  return {
    title: `${title} | Taranka`,
    description,
    alternates: {
      canonical: url,
      languages: { pl: `${SITE}/pl/blog/${slug}`, uk: `${SITE}/uk/blog/${slug}` },
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      ...(og ? { images: [{ url: og }] } : {}),
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
    },
    twitter: {
      card: og ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(og ? { images: [og] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isBlogLocale(lang)) notFound();

  const post = await getPostBySlug(slug, lang).catch(() => null);
  if (!post) notFound();

  const t = UI[lang];
  const hero = postImageURL(post);
  const author = (post.populatedAuthors || []).map((a) => a?.name).filter(Boolean).join(', ');
  const category = post.categories?.[0]?.title;
  const og = postOgImageURL(post);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title || undefined,
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt || post.publishedAt || undefined,
    ...(og ? { image: [og] } : {}),
    author: author ? { '@type': 'Person', name: author } : { '@type': 'Organization', name: 'Taranka' },
    publisher: { '@type': 'Organization', name: 'Taranka' },
    inLanguage: lang,
    mainEntityOfPage: `${SITE}/${lang}/blog/${slug}`,
  };

  return (
    <>
      <article className="mx-auto max-w-[820px] px-6 py-12 font-taranka-body md:px-8">
        <Link href={`/${lang}/blog`} className="text-sm font-semibold text-brand-red-500">
          {t.back}
        </Link>

        <h1 className="mt-6 font-taranka-display text-[40px] font-extrabold uppercase leading-tight text-ink-900">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#6b5750]">
          {post.publishedAt ? <span>{formatBlogDate(post.publishedAt)}</span> : null}
          {category ? <span className="rounded-full bg-black/5 px-3 py-1">{category}</span> : null}
          {author ? (
            <span>
              {t.by}: {author}
            </span>
          ) : null}
        </div>

        {hero ? (
          <div className="mt-8 overflow-hidden rounded-[24px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero} alt={post.heroImage?.alt || post.title || ''} className="w-full object-cover" />
          </div>
        ) : null}

        <div className="mt-10">
          <RichText data={post.content} />
        </div>
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TarankaFooter />
    </>
  );
}
