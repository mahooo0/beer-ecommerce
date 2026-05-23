'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWishlistStore } from '@/stores/wishlist-store';
import { WishlistButton } from '@/components/product/wishlist-button';
import { api } from '@/lib/api';
import type { Product } from '@repo/types';

interface WishlistProduct {
  productId: string;
  priceAtAdd: number;
  product?: Product;
}

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function WishlistPageClient() {
  const storeItems = useWishlistStore((s) => s.items);
  const [mounted, setMounted] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || storeItems.length === 0) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ids = storeItems.map((item) => item.productId);
    api.products.getByIds(ids)
      .then((res) => {
        const productMap = new Map(res.data.map((p) => [p.id, p]));
        setWishlistItems(
          storeItems.map((item) => ({
            ...item,
            product: productMap.get(item.productId),
          })),
        );
      })
      .catch(() => {
        setWishlistItems(storeItems.map((item) => ({ ...item })));
      })
      .finally(() => setLoading(false));
  }, [mounted, storeItems]);

  if (!mounted || loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border-secondary p-4 animate-pulse">
              <div className="bg-secondary_subtle h-48 rounded mb-3" />
              <div className="bg-secondary_subtle h-4 rounded mb-2" />
              <div className="bg-secondary_subtle h-4 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
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
        <h2 className="text-xl font-semibold text-secondary mb-2">Your wishlist is empty</h2>
        <p className="text-tertiary mb-6">Save products you love and come back to them later.</p>
        <Link
          href="/products"
          className="inline-block bg-primary-solid text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-solid_hover transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">
        My Wishlist{' '}
        <span className="text-quaternary text-lg font-normal">({wishlistItems.length})</span>
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlistItems.map((item) => {
          const product = item.product;
          const currentPrice = product?.price ?? item.priceAtAdd;
          const productName = product?.name ?? item.productId;
          const productImage = product?.images?.[0] ?? '';
          const productSlug = product?.slug ?? item.productId;

          return (
            <div
              key={item.productId}
              className="rounded-lg border border-border-secondary overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Product image */}
              <div className="relative">
                <Link href={`/products/${productSlug}`}>
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={productName}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-secondary_subtle flex items-center justify-center">
                      <span className="text-quaternary text-sm">No image</span>
                    </div>
                  )}
                </Link>
                <div className="absolute top-2 right-2">
                  <WishlistButton
                    productId={item.productId}
                    price={currentPrice}
                    size="sm"
                  />
                </div>
              </div>

              {/* Product info */}
              <div className="p-4">
                <Link href={`/products/${productSlug}`} className="hover:underline">
                  <h3 className="font-medium text-primary text-sm line-clamp-2 mb-1">
                    {productName}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-primary">{formatPrice(currentPrice)}</span>
                </div>

                {/* Price drop indicator */}
                {item.priceAtAdd > currentPrice && (
                  <p className="text-xs text-utility-success-700 font-medium mb-2">
                    Price dropped from {formatPrice(item.priceAtAdd)}!
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
