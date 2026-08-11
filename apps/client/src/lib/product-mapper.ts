import type { Product } from '@repo/types';
import type { CatalogProduct } from '@/components/taranka/catalog-card';

/** Fallback image used when a product has no images. Lives in /public/categories. */
export const PRODUCT_IMAGE_FALLBACK = '/categories/product-chrupki.png';

/** Format a price given in cents to a Polish-złoty display string, e.g. 645 -> "6.45 zł". */
export function formatZl(cents: number | undefined | null): string {
  if (cents == null || Number.isNaN(cents)) return '';
  return `${(cents / 100).toFixed(2)} zł`;
}

/** Pull a human-readable weight/size line out of a product's free-form attributes. */
function extractWeight(attributes: Record<string, unknown> | undefined): string {
  if (!attributes) return '';
  const keys = ['weight', 'waga', 'Waga', 'waga netto', 'gramatura', 'Gramatura', 'size', 'objętość'];
  for (const key of keys) {
    const value = attributes[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

/**
 * Resolve current vs. crossed-out price (in cents) from the richer catalog schema.
 * When `salePrice` is set it is the effective price and `price` becomes the "regular";
 * otherwise `price` is current and `compareAtPrice` (if higher) is the crossed-out one.
 */
export function resolvePrices(product: Product): { currentCents: number; regularCents?: number } {
  const p = product as Product & { salePrice?: number | null };
  const sale = typeof p.salePrice === 'number' && p.salePrice > 0 ? p.salePrice : null;
  const currentCents = sale ?? product.price;
  const regularCandidate = sale
    ? product.price
    : typeof product.compareAtPrice === 'number'
      ? product.compareAtPrice
      : undefined;
  const regularCents =
    typeof regularCandidate === 'number' && regularCandidate > currentCents ? regularCandidate : undefined;
  return { currentCents, regularCents };
}

/**
 * Effective in-stock flag for a product: honors the manual `isAvailable` flag
 * and, when quantity is tracked, a positive count. Mirrors the storefront rule
 * used on the detail page.
 */
export function isInStock(product: Product): boolean {
  const p = product as Product & {
    isAvailable?: boolean;
    trackQuantity?: boolean;
    quantity?: number;
  };
  if (p.isAvailable === false) return false;
  if (p.trackQuantity && (p.quantity ?? 0) <= 0) return false;
  return true;
}

/**
 * Map a server `Product` into the display shape the Taranka catalog cards expect.
 * Prices come from the API in cents.
 */
export function toCatalogProduct(product: Product): CatalogProduct {
  const image = product.images?.[0] || PRODUCT_IMAGE_FALLBACK;
  const { currentCents, regularCents } = resolvePrices(product);
  const p = product as Product & { wholesaleTiers?: CatalogProduct['wholesaleTiers'] };

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    weight: extractWeight(product.attributes),
    oldPrice: regularCents != null ? formatZl(regularCents) : '',
    newPrice: formatZl(currentCents),
    image,
    inStock: isInStock(product),
    basePriceCents: currentCents,
    wholesaleTiers: p.wholesaleTiers ?? [],
  };
}

export function toCatalogProducts(products: Product[] | undefined): CatalogProduct[] {
  return (products || []).map(toCatalogProduct);
}
