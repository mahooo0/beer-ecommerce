'use client';

import React, { useState } from 'react';
import { ProductCard } from './product-card';
import { ProductCardList } from './product-card-list';
import { ViewToggle, type ViewMode } from './view-toggle';
import type { ProductCardProduct } from './product-card';

interface ProductGridProps {
  products: ProductCardProduct[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const [view, setView] = useState<ViewMode>('grid');

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h3 className="text-sm font-medium tracking-wider text-neutral-900 uppercase">No products found</h3>
        <p className="mt-2 text-sm text-neutral-500">Try adjusting your filters or check back later.</p>
      </div>
    );
  }

  return (
    <div>
      {/* View toggle */}
      <div className="mb-4 flex justify-end" data-tour="view-toggle">
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 gap-px bg-neutral-200 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, idx) => (
            <div key={product.id} {...(idx === 0 ? { 'data-tour': 'product-card' } : {})}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="divide-y divide-neutral-200 border-y border-neutral-200">
          {products.map((product) => (
            <ProductCardList key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
