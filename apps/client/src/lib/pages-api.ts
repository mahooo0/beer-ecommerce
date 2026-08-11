/**
 * Read-only client for the Payload CMS `pages` collection (apps/cms).
 *
 * These are the admin-controlled marketing/info pages of the storefront
 * (About / Delivery & payment / Franchise / Contacts). Content is bilingual
 * (pl/uk) — the `title`, `layout` blocks and `meta` fields are localized in the
 * CMS, so we fetch by `?locale=`. Anonymous reads return published pages only
 * (Payload `authenticatedOrPublished`), so the storefront needs no token for
 * public content.
 *
 * Caching mirrors blog-api: published reads go through Next's Data Cache with
 * tags (`pages`, `page:<slug>`) + a time-based fallback, revalidated on-demand
 * (see `app/api/revalidate`). Draft preview reads are always `no-store`.
 */

import type { BlogLocale, MediaDoc, ListResponse } from '@/lib/blog-api';

const CMS_URL = (process.env.NEXT_PUBLIC_CMS_URL || 'https://cms.dev.taranka.online').replace(/\/$/, '');

/** Time-based fallback revalidation for published CMS page reads (seconds). */
const PAGES_REVALIDATE = 300;

// ---------- form-builder types ----------

export interface CmsFormOption {
  label?: string | null;
  value?: string | null;
}

/** A single field of a Payload form-builder form. `blockType` is the field kind. */
export interface CmsFormField {
  id?: string | null;
  blockType: 'text' | 'textarea' | 'email' | 'number' | 'select' | 'checkbox' | 'country' | 'state' | 'message';
  name?: string | null;
  label?: string | null;
  required?: boolean | null;
  defaultValue?: string | number | boolean | null;
  width?: number | null;
  placeholder?: string | null;
  options?: CmsFormOption[] | null;
  /** For the `message` (display-only) field kind. */
  message?: unknown;
}

export interface CmsForm {
  id: number | string;
  title?: string | null;
  fields?: CmsFormField[] | null;
  submitButtonLabel?: string | null;
  confirmationType?: 'message' | 'redirect' | null;
  confirmationMessage?: unknown; // Lexical root
  redirect?: { url?: string | null } | null;
}

// ---------- layout block types ----------

export interface ContentColumn {
  size?: 'oneThird' | 'half' | 'twoThirds' | 'full' | null;
  richText?: unknown; // Lexical root
  enableLink?: boolean | null;
  link?: {
    type?: 'reference' | 'custom' | null;
    label?: string | null;
    url?: string | null;
    newTab?: boolean | null;
    appearance?: string | null;
    reference?: { relationTo?: string; value?: { slug?: string } | number | string } | null;
  } | null;
}

export interface ContentBlock {
  blockType: 'content';
  id?: string | null;
  columns?: ContentColumn[] | null;
}

export interface CtaBlock {
  blockType: 'cta';
  id?: string | null;
  richText?: unknown;
  links?: Array<{ link?: ContentColumn['link'] }> | null;
}

export interface MediaBlockType {
  blockType: 'mediaBlock';
  id?: string | null;
  media?: MediaDoc | number | string | null;
}

export interface FormBlockType {
  blockType: 'formBlock';
  id?: string | null;
  form?: CmsForm | number | string | null;
  enableIntro?: boolean | null;
  introContent?: unknown;
}

export type PageBlock = ContentBlock | CtaBlock | MediaBlockType | FormBlockType | { blockType: string; id?: string | null };

export interface CmsPage {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  layout?: PageBlock[] | null;
  meta?: {
    title?: string | null;
    description?: string | null;
    image?: MediaDoc | null;
    noIndex?: boolean | null;
  } | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  _status?: string | null;
}

/** Known storefront content-page slugs (must match the CMS docs + the route folders). */
export const PAGE_SLUGS = ['about', 'delivery', 'franchise', 'contacts'] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

// ---------- fetch ----------

interface CmsFetchOpts {
  draft?: boolean;
  tags?: string[];
  revalidate?: number;
}

async function cmsFetch<T>(path: string, opts: CmsFetchOpts = {}): Promise<T> {
  const { draft, tags = ['pages'], revalidate = PAGES_REVALIDATE } = opts;

  const init: RequestInit & { next?: { tags?: string[]; revalidate?: number } } = {
    headers: { 'Content-Type': 'application/json' },
  };

  if (draft) {
    // Preview reads: never cache, authenticate with a server-only API key so
    // Payload returns the latest (unpublished) version. Cookie auth can't cross
    // subdomains in this decoupled setup.
    init.cache = 'no-store';
    const apiKey = process.env.PAYLOAD_API_KEY;
    if (apiKey) init.headers = { ...init.headers, Authorization: `users API-Key ${apiKey}` };
  } else {
    init.next = { tags, revalidate };
  }

  const res = await fetch(`${CMS_URL}${path}`, init);
  if (!res.ok) throw new Error(`CMS request failed: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

/**
 * Fetch a single published (or draft) page by slug in the given locale.
 * depth 2 populates mediaBlock uploads, the formBlock's form (+ its fields),
 * meta.image, and internal link references.
 */
export async function getPageBySlug(
  slug: string,
  locale: BlogLocale,
  opts: { draft?: boolean } = {},
): Promise<CmsPage | null> {
  const { draft } = opts;
  const qs = new URLSearchParams({
    locale,
    depth: '2',
    limit: '1',
    'where[slug][equals]': slug,
  });
  if (draft) qs.set('draft', 'true');
  else qs.set('where[_status][equals]', 'published');

  const data = await cmsFetch<ListResponse<CmsPage>>(`/api/pages?${qs.toString()}`, {
    draft,
    tags: ['pages', `page:${slug}`],
  });
  return data.docs?.[0] ?? null;
}

/** OpenGraph image URL for a page, if any (meta.image). */
export function pageOgImageURL(p: CmsPage): string | undefined {
  const img = p.meta?.image;
  if (!img || typeof img !== 'object') return undefined;
  const rel = img.sizes?.og?.url || img.sizes?.xlarge?.url || img.url;
  if (!rel) return undefined;
  return rel.startsWith('http') ? rel : `${CMS_URL}${rel}`;
}

/** The CMS base URL, exposed for the form-submission POST (client component). */
export const CMS_BASE_URL = CMS_URL;
