'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCompareStore } from '@/stores/compare-store';

export function CompareHeaderBadge() {
  const [mounted, setMounted] = useState(false);
  const items = useCompareStore((s) => s.items);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? items.length : 0;

  return (
    <Link
      href="/compare"
      aria-label={`Compare${count > 0 ? ` (${count} items)` : ''}`}
      className="relative flex items-center text-neutral-600 transition hover:text-neutral-900"
    >
      <svg
        className="size-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white leading-none">
          {count}
        </span>
      )}
    </Link>
  );
}
