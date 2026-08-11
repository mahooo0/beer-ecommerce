/**
 * Read-only client for the Payload CMS blog (apps/cms).
 * Content is bilingual (pl/uk). Anonymous reads return published posts only
 * (Payload `authenticatedOrPublished` access), so the storefront never needs a token.
 */

const CMS_URL = (process.env.NEXT_PUBLIC_CMS_URL || 'https://cms.dev.taranka.online').replace(/\/$/, '');

export type BlogLocale = 'pl' | 'uk';
export const BLOG_LOCALES: BlogLocale[] = ['pl', 'uk'];
export function isBlogLocale(x: string | undefined): x is BlogLocale {
  return x === 'pl' || x === 'uk';
}

export interface MediaDoc {
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  sizes?: Record<string, { url?: string | null; width?: number | null; height?: number | null }> | null;
}

export interface BlogCategory {
  id: number | string;
  title?: string | null;
  slug?: string | null;
}

export interface BlogPost {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  content?: unknown; // Lexical root
  heroImage?: MediaDoc | null;
  meta?: { title?: string | null; description?: string | null; image?: MediaDoc | null } | null;
  categories?: BlogCategory[] | null;
  populatedAuthors?: Array<{ name?: string | null }> | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  _status?: string | null;
}

interface ListResponse<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

async function cmsFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${CMS_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    // Storefront blog pages are `force-dynamic`; always read fresh so a transient
    // empty response is never cached (avoids stale 404s on new/edited posts).
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`CMS request failed: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export async function getPosts(opts: {
  locale: BlogLocale;
  limit?: number;
  page?: number;
}): Promise<ListResponse<BlogPost>> {
  const { locale, limit = 12, page = 1 } = opts;
  const qs = new URLSearchParams({
    locale,
    depth: '1',
    limit: String(limit),
    page: String(page),
    sort: '-publishedAt',
    'where[_status][equals]': 'published',
  });
  return cmsFetch<ListResponse<BlogPost>>(`/api/posts?${qs.toString()}`);
}

/** Latest posts, tolerant of the CMS being down (returns [] instead of throwing). */
export async function getLatestPostsSafe(locale: BlogLocale, limit = 8): Promise<BlogPost[]> {
  try {
    const data = await getPosts({ locale, limit });
    return data.docs || [];
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string, locale: BlogLocale): Promise<BlogPost | null> {
  const qs = new URLSearchParams({
    locale,
    depth: '1',
    limit: '1',
    'where[slug][equals]': slug,
    'where[_status][equals]': 'published',
  });
  const data = await cmsFetch<ListResponse<BlogPost>>(`/api/posts?${qs.toString()}`);
  return data.docs?.[0] ?? null;
}

/** Slugs are shared across locales (slug is not localized), so one list covers both. */
export async function getAllPostSlugs(): Promise<Array<{ slug: string; updatedAt?: string | null }>> {
  try {
    const qs = new URLSearchParams({
      locale: 'pl',
      depth: '0',
      limit: '1000',
      'where[_status][equals]': 'published',
    });
    const data = await cmsFetch<ListResponse<BlogPost>>(`/api/posts?${qs.toString()}`);
    return (data.docs || [])
      .filter((d) => d.slug)
      .map((d) => ({ slug: d.slug as string, updatedAt: d.updatedAt }));
  } catch {
    return [];
  }
}

// ---------- helpers ----------

export function postImageURL(p: BlogPost): string | undefined {
  return p.heroImage?.url || p.meta?.image?.url || undefined;
}

export function postOgImageURL(p: BlogPost): string | undefined {
  return p.meta?.image?.sizes?.og?.url || p.meta?.image?.url || p.heroImage?.sizes?.og?.url || p.heroImage?.url || undefined;
}

/** Flatten a Lexical editorState to plain text (for excerpts / meta descriptions). */
export function lexicalToPlain(data: unknown): string {
  const root = (data as { root?: { children?: unknown[] } } | null)?.root;
  if (!root) return '';
  let out = '';
  const walk = (n: any) => {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'text' && typeof n.text === 'string') out += n.text;
    if (Array.isArray(n.children)) n.children.forEach(walk);
    if (['paragraph', 'heading', 'listitem', 'quote'].includes(n.type)) out += ' ';
  };
  walk(root);
  return out.replace(/\s+/g, ' ').trim();
}

export function postExcerpt(p: BlogPost, max = 200): string {
  const base = p.meta?.description || lexicalToPlain(p.content);
  return base.length > max ? `${base.slice(0, max).trimEnd()}…` : base;
}

export function formatBlogDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getUTCFullYear()}`;
}
