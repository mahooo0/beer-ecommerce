'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useWishlistStore } from '@/stores/wishlist-store';
import { CatalogCard, type CatalogProduct } from '@/components/taranka/catalog-card';
import { toCatalogProduct } from '@/lib/product-mapper';
import { api } from '@/lib/api';
import type { Product } from '@repo/types';

export function WishlistPageClient() {
  const { t } = useTranslation('misc');
  const storeItems = useWishlistStore((s) => s.items);
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || storeItems.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ids = storeItems.map((item) => item.productId);
    api.products
      .getByIds(ids)
      .then((res) => setProducts(res.data ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [mounted, storeItems]);

  // Keep the favorites' own order (most-recent first as stored) and drop any
  // ids the catalog couldn't resolve.
  const cards: CatalogProduct[] = useMemo(() => {
    const byId = new Map(products.map((p) => [String(p.id), p]));
    return storeItems
      .map((item) => byId.get(String(item.productId)))
      .filter((p): p is Product => Boolean(p))
      .map(toCatalogProduct);
  }, [storeItems, products]);

  if (!mounted || loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold">{t('wishlist.title')}</h1>
        <div className="flex flex-wrap gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[372px] w-[282px] animate-pulse rounded-[20px] bg-[#E2DFD4]" />
          ))}
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 text-center">
        <div className="mb-4 text-fg-quaternary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-secondary">{t('wishlist.empty.title')}</h2>
        <p className="mb-6 text-tertiary">{t('wishlist.empty.subtitle')}</p>
        <Link
          href="/products"
          className="inline-block rounded-lg bg-primary-solid px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-solid_hover"
        >
          {t('wishlist.empty.browse')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">
        {t('wishlist.title')}{' '}
        <span className="text-lg font-normal text-quaternary">({cards.length})</span>
      </h1>
      <div className="flex flex-wrap gap-6">
        {cards.map((p) => (
          <CatalogCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
