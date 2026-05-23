'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export function Pagination({ currentPage, totalPages, basePath = '/products' }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${basePath}?${params.toString()}`);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1 pt-12">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex items-center gap-1 border border-neutral-300 px-4 py-2 text-xs font-medium tracking-wider text-neutral-700 uppercase transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5m0 0l7 7m-7-7l7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Prev
      </button>

      <div className="flex gap-0">
        {pageNumbers.map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`inline-flex size-10 items-center justify-center text-sm font-medium transition ${
                page === currentPage
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={`ellipsis-${index}`} className="inline-flex size-10 items-center justify-center text-sm text-neutral-400">
              ...
            </span>
          )
        )}
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex items-center gap-1 border border-neutral-300 px-4 py-2 text-xs font-medium tracking-wider text-neutral-700 uppercase transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14m0 0l-7-7m7 7l-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
