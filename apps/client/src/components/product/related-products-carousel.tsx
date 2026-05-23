'use client';

import React, { useRef, useState, useCallback } from 'react';
import type { Product } from '@repo/types';
import { ProductCard } from './product-card';

interface RelatedProduct extends Product {
  averageRating?: number;
  reviewCount?: number;
  brand?: { name: string };
}

interface RelatedProductsCarouselProps {
  products: RelatedProduct[];
}

export function RelatedProductsCarousel({ products }: RelatedProductsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -280, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' });
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-primary mb-4">Related Products</h2>

      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            aria-label="Scroll left"
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 items-center justify-center bg-primary shadow-lg rounded-full border border-border-secondary hover:bg-primary_hover transition-colors"
          >
            <svg className="w-5 h-5 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {products.map((product) => (
            <div key={product.id} className="snap-start min-w-[250px] sm:min-w-[220px] flex-shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && products.length > 4 && (
          <button
            onClick={scrollRight}
            aria-label="Scroll right"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 items-center justify-center bg-primary shadow-lg rounded-full border border-border-secondary hover:bg-primary_hover transition-colors"
          >
            <svg className="w-5 h-5 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
