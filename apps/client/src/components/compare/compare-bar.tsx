'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCompareStore } from '../../stores/compare-store';

export function CompareBar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { items, removeItem, clearItems } = useCompareStore((s) => ({
    items: s.items,
    removeItem: s.removeItem,
    clearItems: s.clearItems,
  }));

  if (!mounted || items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white shadow-lg">
      <div className="mx-auto flex max-w-container flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <span className="shrink-0 text-xs font-semibold tracking-wider text-neutral-900 uppercase">Compare:</span>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          {items.map((item) => (
            <div key={item.productId} className="group/thumb relative">
              <div className="relative size-10 overflow-hidden border border-neutral-200 bg-neutral-50">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-neutral-300">
                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <button
                onClick={() => removeItem(item.productId)}
                aria-label={`Remove ${item.name} from compare`}
                className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white opacity-0 transition-opacity group-hover/thumb:opacity-100"
              >
                &times;
              </button>
            </div>
          ))}

          {Array.from({ length: Math.max(0, 2 - items.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="size-10 border border-dashed border-neutral-300 bg-neutral-50"
            />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={clearItems}
            className="text-xs text-neutral-500 transition hover:text-neutral-900"
          >
            Clear
          </button>
          {items.length >= 2 ? (
            <Link
              href="/compare"
              className="bg-neutral-900 px-5 py-2 text-xs font-medium tracking-wider text-white uppercase transition hover:bg-neutral-800"
            >
              Compare ({items.length})
            </Link>
          ) : (
            <span className="cursor-not-allowed bg-neutral-100 px-5 py-2 text-xs font-medium tracking-wider text-neutral-400 uppercase">
              Compare ({items.length})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
