import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * On-demand ISR revalidation. The CMS afterChange/afterDelete hook calls this
 * (only for published docs) so storefront blog pages refresh within seconds
 * instead of re-fetching on every request.
 *
 * POST { secret, slug?, tags?[] }  — secret must equal REVALIDATE_SECRET.
 */
export async function POST(req: Request): Promise<Response> {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) return new Response('Revalidation disabled', { status: 503 });

  let body: { secret?: string; slug?: string; tags?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  if (body.secret !== expected) return new Response('Forbidden', { status: 403 });

  // Bust listing/index caches. (Next 16: revalidateTag needs a cache-life profile.)
  revalidateTag('posts', 'max');
  revalidateTag('categories', 'max');

  // Bust the specific post in both locales + any extra tags.
  if (body.slug) {
    revalidateTag(`post:${body.slug}`, 'max');
    revalidatePath(`/pl/blog/${body.slug}`);
    revalidatePath(`/uk/blog/${body.slug}`);
  }
  for (const tag of body.tags || []) revalidateTag(tag, 'max');

  // Listings + sitemap.
  revalidatePath('/pl/blog');
  revalidatePath('/uk/blog');
  revalidatePath('/sitemap.xml');

  return Response.json({ revalidated: true });
}
