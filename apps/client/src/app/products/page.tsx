import React from 'react';
import type { Metadata } from 'next';
import { ProductGrid } from '@/components/product/product-grid';
import { SortSelector } from '@/components/product/sort-selector';
import { Pagination } from '@/components/product/pagination';
import { api } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Products | STORE',
  description: 'Browse our product catalog',
};

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '20', 10);
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';

  const result = await api.products.getAll({
    page,
    limit,
    sortBy,
    sortOrder,
    status: 'ACTIVE',
  });

  const products = result.data || [];
  const total = result.total || 0;
  const totalPages = result.totalPages || 1;

  return (
    <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <div data-tour="products-header" className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase">Collection</p>
            <h1 className="mt-1 text-display-xs font-light text-neutral-900">
              All Products
            </h1>
            <p className="mt-1 text-sm text-neutral-500">{total} products</p>
          </div>
          <div data-tour="sort-selector">
            <SortSelector currentSort={sortBy} currentOrder={sortOrder} />
          </div>
        </div>
        <div className="mt-6 h-px bg-neutral-200" />
      </div>

      <ProductGrid products={products} />

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} basePath="/products" />
      )}
    </div>
  );
}
