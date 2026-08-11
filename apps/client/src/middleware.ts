import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const CMS_URL = (process.env.NEXT_PUBLIC_CMS_URL || 'https://cms.dev.taranka.online').replace(/\/$/, '');
const REDIRECTS_TTL_MS = 60_000;

interface RedirectDoc {
  from?: string | null;
  to?: { type?: string | null; url?: string | null; reference?: { relationTo?: string; value?: unknown } | null } | null;
}

// Module-scope cache: one small CMS request per instance per minute, not per request.
let cache: { at: number; map: Map<string, string> } | null = null;

function resolveTo(to: RedirectDoc['to']): string | undefined {
  if (!to) return undefined;
  if (to.url) return to.url;
  const ref = to.reference;
  if (ref && ref.value && typeof ref.value === 'object') {
    const slug = (ref.value as { slug?: string }).slug;
    if (slug) return ref.relationTo === 'posts' ? `/pl/blog/${slug}` : `/${slug}`;
  }
  return undefined;
}

async function getRedirectMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (cache && now - cache.at < REDIRECTS_TTL_MS) return cache.map;

  const map = new Map<string, string>();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${CMS_URL}/api/redirects?limit=1000&depth=1`, {
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = (await res.json()) as { docs?: RedirectDoc[] };
      for (const doc of data.docs || []) {
        const from = doc.from?.trim();
        const target = resolveTo(doc.to);
        if (from && target && from !== target) map.set(from, target);
      }
    }
  } catch {
    // Fail open: no redirects on error, keep whatever we had cached.
    if (cache) return cache.map;
  }
  cache = { at: now, map };
  return map;
}

export default clerkMiddleware(async (_auth, req) => {
  const { pathname } = req.nextUrl;

  // Only navigational GETs need redirect lookups.
  if (req.method === 'GET' && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    const map = await getRedirectMap();
    if (map.size > 0) {
      const target = map.get(pathname) || map.get(pathname.replace(/\/$/, ''));
      if (target) {
        const dest = target.startsWith('http') ? target : new URL(target, req.url).toString();
        return NextResponse.redirect(dest, 301);
      }
    }
  }

  // Forward the pathname so the root layout can set <html lang> per URL locale.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
