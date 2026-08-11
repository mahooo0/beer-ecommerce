import { buildAtom } from '@/lib/feed';
import { isBlogLocale } from '@/lib/blog-api';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }): Promise<Response> {
  const { lang } = await params;
  if (!isBlogLocale(lang)) return new Response('Not found', { status: 404 });
  const xml = await buildAtom(lang);
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
