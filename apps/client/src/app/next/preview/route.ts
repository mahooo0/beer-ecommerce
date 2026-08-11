import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Draft preview entrypoint. The CMS "Preview" button links here:
 *   /next/preview?previewSecret=<PREVIEW_SECRET>&path=/pl/blog/<slug>
 * We validate the shared secret, enable Next draft mode (sets a cookie on the
 * storefront domain), then redirect to the target path. The blog page then reads
 * `draftMode()` and fetches the unpublished version with a server-only API key.
 *
 * Anonymous visitors without the secret get 403 and never see drafts.
 */
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');
  const previewSecret = searchParams.get('previewSecret');

  const expected = process.env.PREVIEW_SECRET;
  // Fail closed: if no secret is configured server-side, preview is disabled.
  if (!expected || previewSecret !== expected) {
    return new Response('Forbidden', { status: 403 });
  }
  // Must be a same-site absolute path. Reject protocol-relative (`//host`) and
  // backslash variants that browsers normalize to `//`, to avoid open redirects.
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return new Response('Bad path', { status: 400 });
  }

  const draft = await draftMode();
  draft.enable();

  redirect(path);
}
