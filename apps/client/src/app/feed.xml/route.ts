import { buildRss } from '@/lib/feed';
import { isBlogLocale } from '@/lib/blog-api';

export const dynamic = 'force-dynamic';

// Legacy RSS entrypoint (kept for back-compat). Locale via ?lang=pl|uk (default pl).
// Prefer the clean per-locale route: /{lang}/blog/rss.xml
export async function GET(request: Request): Promise<Response> {
  const lang = new URL(request.url).searchParams.get('lang');
  const locale = isBlogLocale(lang ?? undefined) ? (lang as 'pl' | 'uk') : 'pl';
  const xml = await buildRss(locale);
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
