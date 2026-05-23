'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export function CategoryDropdown({ categories }: { categories: CategoryItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center gap-2 border border-white/30 bg-white/10 px-8 py-3.5 text-xs font-medium tracking-[0.2em] text-white uppercase backdrop-blur-sm transition hover:bg-white/20"
      >
        Choose Category
        <svg className={`size-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 border border-neutral-700 bg-neutral-900 shadow-xl">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="block px-6 py-3 text-xs font-medium tracking-wider text-neutral-300 uppercase transition hover:bg-neutral-800 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
