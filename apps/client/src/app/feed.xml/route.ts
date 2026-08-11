import { getPosts, postExcerpt, type BlogLocale } from '@/lib/blog-api';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.taranka.online').replace(/\/$/, '');

export const dynamic = 'force-dynamic';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// RSS 2.0 feed. Locale via ?lang=pl|uk (default pl).
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const lang: BlogLocale = url.searchParams.get('lang') === 'uk' ? 'uk' : 'pl';

  let docs: Awaited<ReturnType<typeof getPosts>>['docs'] = [];
  try {
    docs = (await getPosts({ locale: lang, limit: 20 })).docs;
  } catch {
    docs = [];
  }

  const items = docs
    .map((p) => {
      const link = `${SITE}/${lang}/blog/${p.slug}`;
      const pub = p.publishedAt ? new Date(p.publishedAt).toUTCString() : '';
      return `    <item>
      <title>${esc(p.title || '')}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
${pub ? `      <pubDate>${pub}</pubDate>\n` : ''}      <description>${esc(postExcerpt(p, 300))}</description>
    </item>`;
    })
    .join('\n');

  const feedTitle = lang === 'uk' ? 'Taranka — Блог' : 'Taranka — Blog';
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(feedTitle)}</title>
    <link>${SITE}/${lang}/blog</link>
    <atom:link href="${SITE}/feed.xml?lang=${lang}" rel="self" type="application/rss+xml" />
    <description>${esc(feedTitle)}</description>
    <language>${lang}</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
