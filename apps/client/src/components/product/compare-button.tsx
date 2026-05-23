'use client';

import React, { useState, useEffect } from 'react';
import { useCompareStore } from '../../stores/compare-store';

interface CompareButtonProps {
  productId: string;
  name: string;
  imageUrl: string;
  slug: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function CompareButton({ productId, name, imageUrl, slug, size = 'sm', className = '' }: CompareButtonProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCompareStore((s) => s.items);
  const toggleItem = useCompareStore((s) => s.toggleItem);

  const isCompared = mounted ? items.some((i) => i.productId === productId) : false;
  const iconSize = size === 'sm' ? 'size-4' : 'size-5';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({ productId, name, imageUrl, slug });
  };

  return (
    <button
      onClick={handleClick}
      aria-label={isCompared ? 'Remove from compare' : 'Add to compare'}
      className={`flex items-center justify-center rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition hover:bg-white ${className}`}
    >
      <svg
        className={`${iconSize} transition-colors duration-200 ${
          isCompared ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'
        }`}
        viewBox="0 0 24 24"
        fill={isCompared ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={isCompared ? 0 : 1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
        />
      </svg>
    </button>
  );
}
