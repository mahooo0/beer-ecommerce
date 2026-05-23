'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCompareStore } from '@/stores/compare-store';
import { api } from '@/lib/api';
import type { Product } from '@repo/types';

interface CategoryAttribute {
  id: string;
  name: string;
  key: string;
  type: string;
  values: string[];
  unit?: string;
}

interface CompareProduct extends Product {
  category?: {
    id: string;
    name: string;
    slug: string;
    attributes?: CategoryAttribute[];
  };
  brand?: {
    id: string;
    name: string;
  };
  tags?: Array<{ tagId: string; tag: { id: string; name: string } }>;
  variants?: Array<{ id: string; sku: string; price: number; stock: number; isActive: boolean }>;
}

interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  products: CompareProduct[];
  attributes: CategoryAttribute[];
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function isFieldDifferent(values: string[]): boolean {
  return new Set(values).size > 1;
}

// ─── Comparison Row ──────────────────────────────────────────────────────────

function CompareRow({
  label,
  values,
  unit,
}: {
  label: string;
  values: string[];
  unit?: string;
}) {
  const differs = isFieldDifferent(values);
  return (
    <tr>
      <td className="sticky left-0 z-10 bg-primary border-b border-border-secondary p-3 text-sm font-medium text-tertiary min-w-[180px] whitespace-nowrap">
        {label}
        {unit && <span className="text-quaternary ml-1 font-normal">({unit})</span>}
      </td>
      {values.map((val, i) => (
        <td
          key={i}
          className={`border-b border-border-secondary p-3 text-sm text-center min-w-[200px] ${differs ? 'bg-utility-warning-50' : ''}`}
        >
          {val || '-'}
        </td>
      ))}
    </tr>
  );
}

// ─── Category Comparison Table ───────────────────────────────────────────────

function CategoryCompareTable({
  group,
  onRemove,
}: {
  group: CategoryGroup;
  onRemove: (productId: string) => void;
}) {
  const { products, attributes } = group;

  // Build display name map from category attributes
  const displayNames = useMemo(() => {
    const map: Record<string, { name: string; unit?: string }> = {};
    for (const attr of attributes) {
      map[attr.key] = { name: attr.name, unit: attr.unit };
    }
    return map;
  }, [attributes]);

  // Collect all attribute keys across products in this category
  const allAttrKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const p of products) {
      if (p.attributes && typeof p.attributes === 'object') {
        for (const key of Object.keys(p.attributes as Record<string, unknown>)) {
          keys.add(key);
        }
      }
    }
    // Sort: category-defined attributes first (by position), then remaining alphabetically
    const catKeyOrder = new Map(attributes.map((a, i) => [a.key, i]));
    return Array.from(keys).sort((a, b) => {
      const aOrder = catKeyOrder.get(a) ?? 9999;
      const bOrder = catKeyOrder.get(b) ?? 9999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.localeCompare(b);
    });
  }, [products, attributes]);

  const getDisplayName = (key: string) =>
    displayNames[key]?.name ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');

  const totalStock = (p: CompareProduct) =>
    p.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;

  return (
    <div className="overflow-x-auto rounded-lg border border-border-secondary">
      <table className="w-full border-collapse">
        {/* Product header row */}
        <thead>
          <tr className="bg-secondary_subtle">
            <th className="sticky left-0 z-10 bg-secondary_subtle min-w-[180px] border-b border-border-secondary p-3 text-left text-xs font-semibold text-tertiary uppercase tracking-wider">
              Characteristics
            </th>
            {products.map((product) => (
              <td
                key={product.id}
                className="border-b border-border-secondary p-4 text-center align-top min-w-[200px]"
              >
                <div className="flex flex-col items-center gap-2">
                  <Link href={`/products/${product.slug}`} className="block">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={140}
                        height={140}
                        className="rounded-lg object-cover mx-auto"
                      />
                    ) : (
                      <div className="w-[140px] h-[140px] bg-secondary_subtle rounded-lg flex items-center justify-center text-quaternary text-xs mx-auto">
                        No image
                      </div>
                    )}
                  </Link>
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-sm font-semibold text-primary hover:underline text-center leading-tight"
                  >
                    {product.name}
                  </Link>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(product.id)}
                    className="flex items-center gap-1 text-xs text-quaternary hover:text-error-primary transition-colors"
                    aria-label={`Remove ${product.name}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Remove
                  </button>
                </div>
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Fixed rows */}
          <CompareRow
            label="Price"
            values={products.map((p) => formatPrice(p.price))}
          />
          <CompareRow
            label="Sale Price"
            values={products.map((p) =>
              p.compareAtPrice ? formatPrice(p.compareAtPrice) : '-',
            )}
          />
          <CompareRow
            label="Brand"
            values={products.map((p) => p.brand?.name ?? '-')}
          />
          <CompareRow
            label="SKU"
            values={products.map((p) => p.sku ?? '-')}
          />
          <CompareRow
            label="Product Type"
            values={products.map((p) =>
              (p.productType ?? '-').toLowerCase().replace(/_/g, ' '),
            )}
          />
          <CompareRow
            label="Stock"
            values={products.map((p) => {
              const stock = totalStock(p);
              return stock > 0 ? `${stock} in stock` : 'Out of stock';
            })}
          />
          <CompareRow
            label="Tags"
            values={products.map((p) =>
              p.tags && p.tags.length > 0
                ? p.tags.map((t) => t.tag.name).join(', ')
                : '-',
            )}
          />

          {/* Separator */}
          {allAttrKeys.length > 0 && (
            <tr>
              <td
                colSpan={products.length + 1}
                className="bg-secondary_subtle p-2 text-xs font-semibold text-tertiary uppercase tracking-wider border-b border-border-secondary"
              >
                Specifications
              </td>
            </tr>
          )}

          {/* Dynamic attribute rows */}
          {allAttrKeys.map((key) => (
            <CompareRow
              key={key}
              label={getDisplayName(key)}
              unit={displayNames[key]?.unit}
              values={products.map((p) => {
                const val = (p.attributes as Record<string, unknown>)?.[key];
                return val !== undefined && val !== null ? String(val) : '-';
              })}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function ComparePageClient() {
  const items = useCompareStore((s) => s.items);
  const removeItem = useCompareStore((s) => s.removeItem);
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch products via batch endpoint
  useEffect(() => {
    if (!mounted) return;
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ids = items.map((item) => item.productId);
    api.products
      .getByIds(ids)
      .then((res) => {
        setProducts(res.data as CompareProduct[]);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [mounted, items]);

  // Group products by category
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const groupMap = new Map<string, CategoryGroup>();
    for (const product of products) {
      const catId = product.category?.id ?? 'uncategorized';
      const catName = product.category?.name ?? 'Other';
      if (!groupMap.has(catId)) {
        groupMap.set(catId, {
          categoryId: catId,
          categoryName: catName,
          products: [],
          attributes: product.category?.attributes ?? [],
        });
      }
      groupMap.get(catId)!.products.push(product);
    }
    return Array.from(groupMap.values());
  }, [products]);

  // Auto-select first category
  useEffect(() => {
    if (categoryGroups.length > 0 && !activeCategory) {
      setActiveCategory(categoryGroups[0]!.categoryId);
    }
    // If active category no longer has products, switch to first available
    if (activeCategory && !categoryGroups.find((g) => g.categoryId === activeCategory)) {
      setActiveCategory(categoryGroups[0]?.categoryId ?? null);
    }
  }, [categoryGroups, activeCategory]);

  const activeGroup = categoryGroups.find((g) => g.categoryId === activeCategory) ?? null;

  // Loading skeleton
  if (!mounted || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-secondary_subtle rounded animate-pulse mb-8" />
        <div className="flex gap-3 mb-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-9 w-28 bg-secondary_subtle rounded-full animate-pulse" />
          ))}
        </div>
        <div className="h-[400px] bg-secondary_subtle rounded-lg animate-pulse" />
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-6">
          <svg
            className="w-20 h-20 text-fg-quaternary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-primary mb-2">
          No products selected for comparison
        </h2>
        <p className="text-tertiary mb-6">
          Browse products and use the compare checkbox to select items
        </p>
        <Link
          href="/products"
          className="inline-block bg-primary-solid text-white px-6 py-3 rounded-lg hover:bg-primary-solid_hover transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">
          Compare Products
          <span className="text-quaternary text-lg font-normal ml-2">
            ({products.length})
          </span>
        </h1>
        <Link href="/products" className="text-sm text-tertiary hover:text-secondary underline">
          Continue Shopping
        </Link>
      </div>

      {/* Category tabs */}
      {categoryGroups.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categoryGroups.map((group) => (
            <button
              key={group.categoryId}
              type="button"
              onClick={() => setActiveCategory(group.categoryId)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === group.categoryId
                  ? 'bg-primary-solid text-white'
                  : 'bg-secondary_subtle text-tertiary hover:bg-primary_hover'
              }`}
            >
              {group.categoryName}
              <span className="ml-1.5 text-xs opacity-70">
                ({group.products.length})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Single category note (when only one category) */}
      {categoryGroups.length === 1 && (
        <p className="text-sm text-tertiary mb-4">
          Category: <span className="font-medium text-secondary">{categoryGroups[0]!.categoryName}</span>
        </p>
      )}

      {/* Comparison table for active category */}
      {activeGroup && activeGroup.products.length >= 2 ? (
        <CategoryCompareTable group={activeGroup} onRemove={removeItem} />
      ) : activeGroup && activeGroup.products.length === 1 ? (
        <div className="rounded-lg border border-border-secondary p-8 text-center">
          <p className="text-tertiary mb-2">
            Only 1 product in <span className="font-medium">{activeGroup.categoryName}</span>.
          </p>
          <p className="text-sm text-quaternary">
            Add another product from this category to compare.
          </p>
          {/* Still show the single product */}
          {(() => {
            const singleProduct = activeGroup.products[0]!;
            return (
              <div className="flex justify-center mt-6">
                <div className="flex flex-col items-center gap-2">
                  {singleProduct.images?.[0] && (
                    <Image
                      src={singleProduct.images[0]}
                      alt={singleProduct.name}
                      width={100}
                      height={100}
                      className="rounded-lg object-cover"
                    />
                  )}
                  <Link
                    href={`/products/${singleProduct.slug}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {singleProduct.name}
                  </Link>
                  <span className="text-sm font-bold">{formatPrice(singleProduct.price)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="rounded-lg border border-border-secondary p-8 text-center text-tertiary">
          Select a category above to compare products.
        </div>
      )}
    </div>
  );
}
