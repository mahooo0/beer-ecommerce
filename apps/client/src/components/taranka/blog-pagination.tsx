import Link from 'next/link';
import type { BlogStrings } from '@/lib/blog-i18n';

/**
 * Listing pagination (Newer / Older + "Page X of Y").
 * `buildHref(page)` is supplied by the caller so query params (e.g. ?q=) are preserved.
 */
export function BlogPagination({
  page,
  totalPages,
  buildHref,
  t,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  t: BlogStrings;
}) {
  if (totalPages <= 1) return null;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const arrowCls =
    'inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-2 text-sm font-semibold text-[#443029] transition-colors hover:border-brand-red-500 hover:text-brand-red-500';
  const disabledCls = 'inline-flex items-center gap-2 rounded-full border border-black/5 px-5 py-2 text-sm font-semibold text-black/25';

  return (
    <nav className="mt-14 flex items-center justify-between gap-4" aria-label={t.paginationLabel}>
      {hasNext ? (
        // Older posts are on the *next* page (sorted newest-first).
        <Link href={buildHref(page + 1)} className={arrowCls} rel="next">
          ← {t.older}
        </Link>
      ) : (
        <span className={disabledCls}>← {t.older}</span>
      )}

      <span className="text-sm text-[#6b5750]">{t.pageOf(page, totalPages)}</span>

      {hasPrev ? (
        <Link href={buildHref(page - 1)} className={arrowCls} rel="prev">
          {t.newer} →
        </Link>
      ) : (
        <span className={disabledCls}>{t.newer} →</span>
      )}
    </nav>
  );
}
