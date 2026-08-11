import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '../../../payload-types'

/**
 * Notify the decoupled storefront to revalidate its cached blog pages.
 * Fire-and-forget: never block or fail the CMS write. Only called for published
 * (or previously-published) docs so autosaved drafts don't touch public pages.
 */
function notifyStorefront(slug?: string | null): void {
  const base = process.env.STOREFRONT_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!base || !secret) return
  void fetch(`${base}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, slug }),
  }).catch(() => {
    /* best-effort */
  })
}

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/posts/${doc.slug}`

      payload.logger.info(`Revalidating post at path: ${path}`)

      revalidatePath(path)
      revalidateTag('posts-sitemap', 'max')
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = `/posts/${previousDoc.slug}`

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      revalidatePath(oldPath)
      revalidateTag('posts-sitemap', 'max')
    }

    // Storefront: revalidate when the post is (or just stopped being) published.
    if (doc._status === 'published' || previousDoc?._status === 'published') {
      notifyStorefront(doc.slug)
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/posts/${doc?.slug}`

    revalidatePath(path)
    revalidateTag('posts-sitemap', 'max')

    notifyStorefront(doc?.slug)
  }

  return doc
}
