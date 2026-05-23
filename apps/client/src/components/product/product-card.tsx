'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@repo/types';
import { StarRating } from '../ui/star-rating';
import { WishlistButton } from './wishlist-button';
import { CompareButton } from './compare-button';
import { useCartStore } from '@/stores/cart-store';

export interface ProductCardProduct extends Product {
  averageRating?: number;
  reviewCount?: number;
  brand?: { name: string };
  category?: { name: string };
  _count?: { variants: number };
}

interface ProductCardProps {
  product: ProductCardProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = React.useState(false);
  const [buyNow, setBuyNow] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const primaryImage = product.images[0];
  const secondaryImage = product.images[1];
  const hasImage = primaryImage && primaryImage.length > 0;
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = onSale
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  const isNew =
    (Date.now() - new Date(product.createdAt).getTime()) < 14 * 24 * 60 * 60 * 1000;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      variantId: '',
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: primaryImage || '',
      sku: product.sku || '',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      variantId: '',
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: primaryImage || '',
      sku: product.sku || '',
    });
    setBuyNow(true);
    setTimeout(() => {
      window.location.href = '/cart';
    }, 300);
  };

  return (
    <div
      className="group/card relative flex flex-col bg-white transition"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
        <Link href={`/products/${product.slug}`} className="block size-full">
          {hasImage ? (
            <>
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                className={`object-cover transition duration-500 ${
                  hovered && secondaryImage ? 'opacity-0 scale-105' : 'opacity-100'
                }`}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {secondaryImage && (
                <Image
                  src={secondaryImage}
                  alt={`${product.name} - alternate view`}
                  fill
                  className={`object-cover transition duration-500 ${
                    hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  }`}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
            </>
          ) : (
            <div className="flex size-full items-center justify-center text-neutral-300">
              <svg className="size-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
          )}
        </Link>

        {/* Stacked badges - top left */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {onSale && (
            <span className="bg-neutral-900 px-2 py-1 text-[10px] font-medium tracking-wider text-white uppercase">
              -{discountPercent}%
            </span>
          )}
          {isNew && (
            <span className="bg-white px-2 py-1 text-[10px] font-medium tracking-wider text-neutral-900 uppercase ring-1 ring-inset ring-neutral-200">
              New
            </span>
          )}
        </div>

        {/* Top right: Wishlist + Compare icons */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 max-sm:opacity-100">
          <span data-tour="card-wishlist"><WishlistButton productId={product.id} price={product.price} size="sm" /></span>
          <span data-tour="card-compare"><CompareButton
            productId={product.id}
            name={product.name}
            imageUrl={primaryImage || ''}
            slug={product.slug}
          /></span>
        </div>

        {/* Bottom overlay: Add to Cart + Buy Now */}
        <div data-tour="card-actions" className="absolute inset-x-0 bottom-0 z-10 translate-y-full bg-white/95 backdrop-blur-sm p-3 transition-transform duration-200 group-hover/card:translate-y-0 max-sm:translate-y-0">
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className={`flex-1 py-2 text-xs font-medium tracking-wider uppercase transition ${
                added
                  ? 'bg-neutral-700 text-white'
                  : 'border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              {added ? 'Added' : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={buyNow}
              className="flex-1 border border-neutral-300 bg-white py-2 text-xs font-medium tracking-wider text-neutral-900 uppercase transition hover:bg-neutral-50"
            >
              {buyNow ? 'Redirecting...' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col p-4">
        {product.brand?.name && (
          <p className="mb-1 text-[10px] font-medium tracking-[0.15em] text-neutral-400 uppercase">{product.brand.name}</p>
        )}
        <h3 className="text-sm font-medium text-neutral-900 line-clamp-2">{product.name}</h3>

        {product.averageRating !== undefined && product.averageRating > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <StarRating rating={product.averageRating} size="sm" />
            {product.reviewCount !== undefined && product.reviewCount > 0 && (
              <span className="text-xs text-neutral-400">({product.reviewCount})</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-2 flex items-baseline gap-2">
          {onSale ? (
            <>
              <span className="text-sm font-semibold text-neutral-900">{formatPrice(product.price)}</span>
              <span className="text-xs text-neutral-400 line-through">{formatPrice(product.compareAtPrice!)}</span>
            </>
          ) : (
            <span className="text-sm font-semibold text-neutral-900">{formatPrice(product.price)}</span>
          )}
        </div>
      </Link>
    </div>
  );
}
