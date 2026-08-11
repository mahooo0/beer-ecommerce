import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TarankaFooter } from '@/components/taranka/footer';
import { TarankaBlogCard } from '@/components/taranka/blog-card';
import { getPosts, isBlogLocale, type BlogLocale } from '@/lib/blog-api';

export const dynamic = 'force-dynamic';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.taranka.online').replace(/\/$/, '');

const UI: Record<BlogLocale, { title: string; subtitle: string; readMore: string; empty: string }> = {
  pl: { title: 'Blog', subtitle: 'Przydatne wiadomości ze świata Taranka', readMore: 'więcej', empty: 'Brak wpisów.' },
  uk: { title: 'Блог', subtitle: 'Корисні новини зі світу Taranka', readMore: 'більше', empty: 'Поки що немає записів.' },
};

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isBlogLocale(lang)) return {};
  const t = UI[lang];
  return {
    title: `${t.title} | Taranka`,
    description: t.subtitle,
    alternates: {
      canonical: `${SITE}/${lang}/blog`,
      languages: { pl: `${SITE}/pl/blog`, uk: `${SITE}/uk/blog` },
    },
    openGraph: { title: `${t.title} | Taranka`, description: t.subtitle, url: `${SITE}/${lang}/blog`, type: 'website' },
  };
}

export default async function BlogListPage({ params }: Props) {
  const { lang } = await params;
  if (!isBlogLocale(lang)) notFound();
  const t = UI[lang];

  let posts: Awaited<ReturnType<typeof getPosts>>['docs'] = [];
  try {
    posts = (await getPosts({ locale: lang, limit: 24 })).docs;
  } catch {
    posts = [];
  }

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-12 font-taranka-body">
        <h1 className="font-taranka-display text-[48px] font-extrabold uppercase leading-none text-ink-900">{t.title}</h1>
        <p className="mt-3 text-[#6b5750]">{t.subtitle}</p>

        {posts.length === 0 ? (
          <p className="mt-16 text-[#6b5750]">{t.empty}</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <TarankaBlogCard key={p.id} post={p} lang={lang} readMore={t.readMore} />
            ))}
          </div>
        )}
      </div>
      <TarankaFooter />
    </>
  );
}
