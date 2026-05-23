'use client';

import { useState, useCallback } from 'react';
import ProductImageGallery from '@/components/product/product-image-gallery';
import { VariantSelector } from '@/components/product/variant-selector';
import { StockStatus } from '@/components/product/stock-status';
import { AddToCartButton } from '@/components/product/add-to-cart-button';
import { WeightedQuantitySelector } from '@/components/product/weighted-quantity-selector';
import { WishlistButton } from '@/components/product/wishlist-button';
import { CompareButton } from '@/components/product/compare-button';
import { StarRating } from '@/components/ui/star-rating';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';
import type { ProductDetail, ProductVariantDetail } from '@/types/product-detail';

interface ProductPageClientProps {
  product: ProductDetail;
}

export function ProductPageClient({ product }: ProductPageClientProps) {
  const isVariable = product.productType === 'VARIABLE';
  const isWeighted = product.productType === 'WEIGHTED';
  const addItem = useCartStore((s) => s.addItem);
  const [buyingNow, setBuyingNow] = useState(false);

  const firstVariant: ProductVariantDetail | null =
    isVariable && product.variants.length > 0 ? (product.variants[0] ?? null) : null;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDetail | null>(firstVariant);
  const [weightTotal, setWeightTotal] = useState<number>(
    product.weightedMeta?.minWeight ?? 0.1,
  );
  const [weightedPrice, setWeightedPrice] = useState<number>(product.price);

  const variantImages =
    selectedVariant && (selectedVariant as { images?: string[] }).images?.length
      ? (selectedVariant as { images?: string[] }).images!
      : [];
  const currentImages = variantImages.length > 0 ? variantImages : product.images;
  const currentPrice = isWeighted
    ? weightedPrice
    : selectedVariant?.price ?? product.price;
  const currentStock =
    selectedVariant?.stock ??
    (product.variants.length > 0 ? (product.variants[0]?.stock ?? 0) : 0);
  const currentSku = selectedVariant?.sku ?? product.sku ?? '';
  const currentVariantId = selectedVariant?.id;

  const handleVariantChange = useCallback((variant: ProductVariantDetail | null) => {
    setSelectedVariant(variant);
  }, []);

  const handleWeightChange = useCallback((weight: number) => {
    setWeightTotal(weight);
  }, []);

  const handleWeightedPriceChange = useCallback((totalCents: number) => {
    setWeightedPrice(totalCents);
  }, []);

  const isOnSale =
    product.compareAtPrice != null && product.compareAtPrice > currentPrice;

  const categoryName =
    (product.category as { name?: string })?.name ?? null;

  const averageRating = (product as { averageRating?: number }).averageRating ?? 0;
  const reviewCount = (product as { reviewCount?: number }).reviewCount ?? 0;

  const handleBuyNow = () => {
    if (currentStock <= 0) return;
    addItem({
      productId: product.id,
      variantId: currentVariantId ?? '',
      name: product.name,
      price: currentPrice,
      quantity: isWeighted ? weightTotal : 1,
      imageUrl: currentImages[0] ?? '',
      sku: currentSku,
    });
    setBuyingNow(true);
    setTimeout(() => {
      window.location.href = '/cart';
    }, 300);
  };

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      {/* Left column: image gallery */}
      <div data-tour="product-gallery">
        <ProductImageGallery images={currentImages} productName={product.name} />
      </div>

      {/* Right column: product info */}
      <div data-tour="product-info" className="flex flex-col gap-5">
        {/* Breadcrumb */}
        {categoryName && (
          <nav className="text-xs tracking-wider text-neutral-400 uppercase" aria-label="Breadcrumb">
            <span>Products</span>
            <span className="mx-2">/</span>
            <span>{categoryName}</span>
          </nav>
        )}

        {/* Product name */}
        <h1 className="text-2xl font-light tracking-tight text-neutral-900 lg:text-3xl">{product.name}</h1>

        {/* Brand */}
        {product.brand && (
          <p className="text-xs tracking-wider text-neutral-400 uppercase">
            by{' '}
            <span className="font-medium text-neutral-600">
              {(product.brand as { name: string }).name}
            </span>
          </p>
        )}

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={averageRating} size="sm" />
            <span className="text-xs text-neutral-400">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold text-neutral-900">
            {formatPrice(currentPrice)}
          </span>
          {isOnSale && product.compareAtPrice != null && (
            <>
              <span className="text-lg text-neutral-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
              <span className="bg-neutral-900 px-2 py-0.5 text-[10px] font-medium tracking-wider text-white uppercase">
                Sale
              </span>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-200" />

        {/* Variant selector */}
        {isVariable && product.variants.length > 0 && (
          <VariantSelector
            variants={product.variants}
            onVariantChange={handleVariantChange}
          />
        )}

        {/* Weighted quantity selector */}
        {isWeighted && product.weightedMeta && (
          <WeightedQuantitySelector
            pricePerUnit={product.weightedMeta.pricePerUnit}
            unit={product.weightedMeta.unit}
            minWeight={product.weightedMeta.minWeight ?? undefined}
            maxWeight={product.weightedMeta.maxWeight ?? undefined}
            onWeightChange={handleWeightChange}
            onPriceChange={handleWeightedPriceChange}
          />
        )}

        {/* Stock status */}
        <StockStatus stock={currentStock} />

        {/* Add to cart */}
        <div data-tour="add-to-cart"><AddToCartButton
          productId={product.id}
          variantId={currentVariantId}
          productName={product.name}
          price={currentPrice}
          imageUrl={currentImages[0] ?? ''}
          sku={currentSku}
          stock={currentStock}
          productType={product.productType}
          weight={isWeighted ? weightTotal : undefined}
        /></div>

        {/* Buy in One Click */}
        <button data-tour="buy-now"
          onClick={handleBuyNow}
          disabled={currentStock <= 0 || buyingNow}
          className="w-full border border-neutral-300 bg-white py-3 text-xs font-medium tracking-[0.2em] text-neutral-900 uppercase transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buyingNow ? 'Redirecting...' : 'Buy in One Click'}
        </button>

        {/* Wishlist + Compare row */}
        <div data-tour="wishlist-compare" className="flex items-center gap-6 border-t border-neutral-200 pt-5">
          <div className="inline-flex items-center gap-2">
            <WishlistButton productId={product.id} price={currentPrice} size="md" className="bg-neutral-100 hover:bg-neutral-200" />
            <span className="text-xs tracking-wider text-neutral-500 uppercase">Add to Wishlist</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <CompareButton
              productId={product.id}
              name={product.name}
              imageUrl={currentImages[0] ?? ''}
              slug={product.slug}
              size="md"
              className="bg-neutral-100 hover:bg-neutral-200"
            />
            <span className="text-xs tracking-wider text-neutral-500 uppercase">Compare</span>
          </div>
        </div>

        {/* SKU */}
        {currentSku && (
          <p className="text-xs text-neutral-400">SKU: {currentSku}</p>
        )}

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tagEntry) => (
              <span
                key={tagEntry.tagId}
                className="border border-neutral-200 px-3 py-1 text-[10px] font-medium tracking-wider text-neutral-500 uppercase"
              >
                {tagEntry.tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
