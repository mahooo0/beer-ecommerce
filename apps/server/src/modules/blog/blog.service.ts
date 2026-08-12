/**
 * Thin proxy to the Payload CMS REST API (apps/cms) so the main admin can manage
 * blog/content natively without a second login. All writes authenticate with a
 * server-only Payload API key (`Authorization: users API-Key <key>`) — the key
 * never reaches the browser. Callers are already gated by `requireAdmin` (Clerk).
 *
 * We forward Payload's own response shape (docs/totalDocs/…) untouched so the
 * admin client can talk Payload's query language (where[...], locale, depth,
 * draft, sort, page, limit) directly.
 */

const CMS_URL = (
  process.env.CMS_URL ||
  process.env.NEXT_PUBLIC_CMS_URL ||
  'https://cms.dev.taranka.online'
).replace(/\/$/, '');

const API_KEY = process.env.PAYLOAD_API_KEY || '';

/** Collections the admin is allowed to manage through this proxy. */
export const BLOG_COLLECTIONS = ['posts', 'categories', 'media', 'forms', 'form-submissions', 'pages'] as const;
export type BlogCollection = (typeof BLOG_COLLECTIONS)[number];

export function isBlogCollection(x: string): x is BlogCollection {
  return (BLOG_COLLECTIONS as readonly string[]).includes(x);
}

export interface CmsError extends Error {
  status?: number;
  body?: unknown;
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...(extra || {}) };
  if (API_KEY) h['Authorization'] = `users API-Key ${API_KEY}`;
  return h;
}

async function pfetch(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${CMS_URL}${path}`, init);
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const err = new Error(`CMS ${res.status} ${path}`) as CmsError;
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export const blogService = {
  list(collection: BlogCollection, query: string) {
    return pfetch(`/api/${collection}${query ? `?${query}` : ''}`, { headers: authHeaders() });
  },
  getOne(collection: BlogCollection, id: string, query: string) {
    return pfetch(`/api/${collection}/${id}${query ? `?${query}` : ''}`, { headers: authHeaders() });
  },
  create(collection: BlogCollection, body: unknown, query: string) {
    return pfetch(`/api/${collection}${query ? `?${query}` : ''}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body ?? {}),
    });
  },
  update(collection: BlogCollection, id: string, body: unknown, query: string) {
    return pfetch(`/api/${collection}/${id}${query ? `?${query}` : ''}`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body ?? {}),
    });
  },
  remove(collection: BlogCollection, id: string, query: string) {
    return pfetch(`/api/${collection}/${id}${query ? `?${query}` : ''}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
  },
  /**
   * Forward a raw multipart body straight to Payload's media upload endpoint.
   * We keep the original Content-Type (with its boundary) so Payload re-parses
   * the same multipart the browser sent.
   */
  uploadMedia(contentType: string, body: Buffer, query: string) {
    return pfetch(`/api/media${query ? `?${query}` : ''}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': contentType }),
      body: body as unknown as BodyInit,
    });
  },
};
