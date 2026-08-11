/**
 * Read-only client for the Payload CMS blog (apps/cms).
 * Content is bilingual (pl/uk). Anonymous reads return published posts only
 * (Payload `authenticatedOrPublished` access), so the storefront never needs a token
 * for public content. Draft preview reads authenticate with a server-only API key.
 *
 * Caching: published reads go through Next's Data Cache with tags (`posts`,
 * `post:<slug>`, `categories`) + a time-based fallback, so the storefront serves
 * cached CMS data between edits and can be revalidated on-demand (see
 * `app/api/revalidate`). Draft reads are always `no-store`.
 */

const CMS_URL = (process.env.NEXT_PUBLIC_CMS_URL || 'https://cms.dev.taranka.online').replace(/\/$/, '');

/** Time-based fallback revalidation for published CMS reads (seconds). */
const POSTS_REVALIDATE = 300;

export type BlogLocale = 'pl' | 'uk';
export const BLOG_LOCALES: BlogLocale[] = ['pl', 'uk'];
export function isBlogLocale(x: string | undefined): x is BlogLocale {
  return x === 'pl' || x === 'uk';
}

/** OpenGraph locale codes for each site locale. */
export const OG_LOCALE: Record<BlogLocale, string> = { pl: 'pl_PL', uk: 'uk_UA' };

export interface MediaSize {
  url?: string | null;
  width?: number | null;
  height?: number | null;
}
export interface MediaDoc {
  id?: number | string;
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  caption?: unknown;
  sizes?: Record<string, MediaSize | undefined> | null;
}

export interface BlogCategory {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  parent?: BlogCategory | number | string | null;
  breadcrumbs?: Array<{ doc?: number | string; url?: string | null; label?: string | null }> | null;
}

/** A related post as populated by Posts.defaultPopulate (title, slug, categories, meta.image/description). */
export interface RelatedPost {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  categories?: BlogCategory[] | null;
  meta?: { description?: string | null; image?: MediaDoc | null } | null;
}

export interface BlogPost {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  content?: unknown; // Lexical root
  heroImage?: MediaDoc | null;
  meta?: {
    title?: string | null;
    description?: string | null;
    image?: MediaDoc | null;
    noIndex?: boolean | null;
  } | null;
  categories?: BlogCategory[] | null;
  relatedPosts?: Array<RelatedPost | number | string> | null;
  populatedAuthors?: Array<{ name?: string | null }> | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  _status?: string | null;
}

export interface ListResponse<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

interface CmsFetchOpts {
  /** Draft preview: authenticate + never cache. */
  draft?: boolean;
  /** Next Data Cache tags for on-demand revalidation (published reads only). */
  tags?: string[];
  /** Time-based fallback revalidation in seconds (published reads only). */
  revalidate?: number;
}

async function cmsFetch<T>(path: string, opts: CmsFetchOpts = {}): Promise<T> {
  const { draft, tags = ['posts'], revalidate = POSTS_REVALIDATE } = opts;

  const init: RequestInit & { next?: { tags?: string[]; revalidate?: number } } = {
    headers: { 'Content-Type': 'application/json' },
  };

  if (draft) {
    // Preview reads must never be cached and must authenticate so Payload returns
    // the latest (unpublished) version. Cookie auth can't cross subdomains in this
    // decoupled setup, so we use a server-only API key.
    init.cache = 'no-store';
    const apiKey = process.env.PAYLOAD_API_KEY;
    if (apiKey) {
      init.headers = { ...init.headers, Authorization: `users API-Key ${apiKey}` };
    }
  } else {
    // Published reads: cache via the Data Cache, revalidated by tag or by time.
    init.next = { tags, revalidate };
  }

  const res = await fetch(`${CMS_URL}${path}`, init);
  if (!res.ok) throw new Error(`CMS request failed: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

// ---------- posts ----------

export async function getPosts(opts: {
  locale: BlogLocale;
  limit?: number;
  page?: number;
  depth?: number;
}): Promise<ListResponse<BlogPost>> {
  const { locale, limit = 12, page = 1, depth = 1 } = opts;
  const qs = new URLSearchParams({
    locale,
    depth: String(depth),
    limit: String(limit),
    page: String(page),
    sort: '-publishedAt',
    'where[_status][equals]': 'published',
  });
  return cmsFetch<ListResponse<BlogPost>>(`/api/posts?${qs.toString()}`, { tags: ['posts'] });
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

export async function getPostBySlug(
  slug: string,
  locale: BlogLocale,
  opts: { draft?: boolean } = {},
): Promise<BlogPost | null> {
  const { draft } = opts;
  const qs = new URLSearchParams({
    locale,
    // depth 2 populates content upload/relationship/link nodes, meta.image,
    // categories and relatedPosts (defaultPopulate → nested meta.image).
    depth: '2',
    limit: '1',
    'where[slug][equals]': slug,
  });
  if (draft) qs.set('draft', 'true');
  else qs.set('where[_status][equals]', 'published');

  const data = await cmsFetch<ListResponse<BlogPost>>(`/api/posts?${qs.toString()}`, {
    draft,
    tags: ['posts', `post:${slug}`],
  });
  return data.docs?.[0] ?? null;
}

/**
 * Simple bilingual search over published posts by (localized) title.
 * NB: querying the nested localized `meta.description` via REST `like` 500s the
 * CMS, so we match on `title` only — which is the primary search field anyway.
 */
export async function searchPosts(q: string, locale: BlogLocale, limit = 24): Promise<BlogPost[]> {
  const query = q.trim();
  if (!query) return [];
  const qs = new URLSearchParams({
    locale,
    depth: '1',
    limit: String(limit),
    sort: '-publishedAt',
    'where[_status][equals]': 'published',
    'where[title][like]': query,
  });
  try {
    const data = await cmsFetch<ListResponse<BlogPost>>(`/api/posts?${qs.toString()}`, { tags: ['posts'] });
    return data.docs || [];
  } catch {
    return [];
  }
}

/**
 * Slugs (+ updatedAt + og image) for the sitemap. Slug is shared across locales,
 * so one list covers both. depth 1 so meta.image / heroImage resolve for image sitemap.
 */
export async function getAllPostSlugs(): Promise<
  Array<{ slug: string; updatedAt?: string | null; image?: string }>
> {
  try {
    const qs = new URLSearchParams({
      locale: 'pl',
      depth: '1',
      limit: '1000',
      'where[_status][equals]': 'published',
    });
    const data = await cmsFetch<ListResponse<BlogPost>>(`/api/posts?${qs.toString()}`, {
      tags: ['posts'],
    });
    return (data.docs || [])
      .filter((d) => d.slug)
      .map((d) => ({ slug: d.slug as string, updatedAt: d.updatedAt, image: postOgImageURL(d) }));
  } catch {
    return [];
  }
}

/** Neighbours by publish date: `prev` = older, `next` = newer. For post nav. */
export async function getAdjacentPosts(
  publishedAt: string | null | undefined,
  locale: BlogLocale,
): Promise<{ prev: BlogPost | null; next: BlogPost | null }> {
  if (!publishedAt) return { prev: null, next: null };
  const build = (dir: 'older' | 'newer') => {
    const qs = new URLSearchParams({
      locale,
      depth: '0',
      limit: '1',
      sort: dir === 'older' ? '-publishedAt' : 'publishedAt',
      'where[_status][equals]': 'published',
    });
    qs.append(dir === 'older' ? 'where[publishedAt][less_than]' : 'where[publishedAt][greater_than]', publishedAt);
    return qs;
  };
  try {
    const [older, newer] = await Promise.all([
      cmsFetch<ListResponse<BlogPost>>(`/api/posts?${build('older').toString()}`, { tags: ['posts'] }),
      cmsFetch<ListResponse<BlogPost>>(`/api/posts?${build('newer').toString()}`, { tags: ['posts'] }),
    ]);
    return { prev: older.docs?.[0] ?? null, next: newer.docs?.[0] ?? null };
  } catch {
    return { prev: null, next: null };
  }
}

// ---------- categories ----------

export async function getCategories(locale: BlogLocale): Promise<BlogCategory[]> {
  try {
    const qs = new URLSearchParams({ locale, depth: '1', limit: '100', sort: 'title' });
    const data = await cmsFetch<ListResponse<BlogCategory>>(`/api/categories?${qs.toString()}`, {
      tags: ['categories'],
    });
    return data.docs || [];
  } catch {
    return [];
  }
}

export async function getCategoryBySlug(slug: string, locale: BlogLocale): Promise<BlogCategory | null> {
  const qs = new URLSearchParams({
    locale,
    depth: '1',
    limit: '1',
    'where[slug][equals]': slug,
  });
  try {
    const data = await cmsFetch<ListResponse<BlogCategory>>(`/api/categories?${qs.toString()}`, {
      tags: ['categories', `category:${slug}`],
    });
    return data.docs?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getPostsByCategory(opts: {
  categoryId: number | string;
  locale: BlogLocale;
  page?: number;
  limit?: number;
}): Promise<ListResponse<BlogPost>> {
  const { categoryId, locale, page = 1, limit = 12 } = opts;
  const qs = new URLSearchParams({
    locale,
    depth: '1',
    limit: String(limit),
    page: String(page),
    sort: '-publishedAt',
    'where[_status][equals]': 'published',
  });
  qs.append('where[categories][in][]', String(categoryId));
  return cmsFetch<ListResponse<BlogPost>>(`/api/posts?${qs.toString()}`, {
    tags: ['posts', `category:${categoryId}`],
  });
}

// ---------- helpers ----------

export function postImageURL(p: BlogPost): string | undefined {
  return p.heroImage?.url || p.meta?.image?.url || undefined;
}

export function postOgImageURL(p: BlogPost): string | undefined {
  return (
    p.meta?.image?.sizes?.og?.url ||
    p.meta?.image?.url ||
    p.heroImage?.sizes?.og?.url ||
    p.heroImage?.url ||
    undefined
  );
}

/** Full og image object (url + dimensions + alt) for OpenGraph metadata. */
export function postOgImage(p: BlogPost): { url: string; width?: number; height?: number; alt?: string } | undefined {
  const media = p.meta?.image || p.heroImage;
  if (!media) return undefined;
  const og = media.sizes?.og;
  const url = og?.url || media.url;
  if (!url) return undefined;
  return {
    url,
    width: og?.width ?? media.width ?? undefined,
    height: og?.height ?? media.height ?? undefined,
    alt: media.alt || p.title || undefined,
  };
}

/** Href for an internal Payload doc referenced from rich text / relationships. */
export function internalDocToHref(relationTo: string | undefined, slug: string | undefined, lang: BlogLocale): string {
  if (!slug) return '#';
  if (relationTo === 'posts') return `/${lang}/blog/${slug}`;
  // pages are not localized on the storefront
  return `/${slug}`;
}

/** Flatten a Lexical editorState to plain text (for excerpts / meta descriptions / reading time). */
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

/** Estimated reading time in minutes (>=1) at ~200 wpm. */
export function readingTime(content: unknown): number {
  const words = lexicalToPlain(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
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
