"use client";

import { useFilters } from "@/hooks/use-filters";

interface CatalogPaginationProps {
  /** Current page from the server render (SSR-accurate, avoids hydration flicker). */
  currentPage: number;
  totalPages: number;
  /** Cap on how many numbered buttons render at once. */
  maxLinks?: number;
  ariaLabel?: string;
}

/**
 * Taranka-styled pager driven by nuqs. Writing `page` through `useFilters`
 * (shallow:false) triggers a real navigation so the server component re-fetches
 * the matching page. `clearOnDefault` keeps `page=1` out of the URL.
 */
export function CatalogPagination({
  currentPage,
  totalPages,
  maxLinks = 8,
  ariaLabel,
}: CatalogPaginationProps) {
  const [, setFilters] = useFilters();

  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(currentPage - 3, totalPages - maxLinks + 1));
  const pages = Array.from({ length: Math.min(maxLinks, totalPages) }, (_, i) => start + i).filter(
    (p) => p >= 1 && p <= totalPages,
  );

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label={ariaLabel}>
      {pages.map((p) => {
        const active = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => setFilters({ page: p })}
            className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-red-500 text-cream-50"
                : "bg-[#E2DFD4] text-ink-900 hover:bg-[#cfccbf]"
            }`}
          >
            {p}
          </button>
        );
      })}
    </nav>
  );
}
