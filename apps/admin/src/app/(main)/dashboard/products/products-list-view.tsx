'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Product } from '@repo/types';
import { computeProductCompleteness, type ProductLike } from '@/lib/product-completeness';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { CompletenessBar } from '@/components/product/completeness-bar';
import { ProductStatusBadge } from '@/components/product/product-status-badge';
import { ProductsFilters } from './products-filters';
import { ProductRowActions } from './product-row-actions';

// Admin-only per-row annotations the catalog filter endpoint may attach.
type ProductRow = Product & {
  category?: { id: string; name: string } | null;
  categoryAttrCount?: number;
  productAttrFilledCount?: number;
};

function formatPrice(cents: number) {
  return `${(cents / 100).toFixed(2)} ₴`;
}

function rowCompleteness(product: ProductRow) {
  return computeProductCompleteness(product as ProductLike, {
    attributesNeeded: product.categoryAttrCount ?? 0,
    attributesFilled: product.productAttrFilledCount ?? 0,
  });
}

interface ProductsListViewProps {
  products: ProductRow[];
  total: number;
  totalPages: number;
  page: number;
  incompleteCount: number;
  isClientStats: boolean;
  initialFilters: {
    categoryId: string;
    status: string;
    isAvailable: string;
    minPrice: string;
    maxPrice: string;
    completeness: string;
    attributeValues: string;
  };
  prevHref: string;
  nextHref: string;
}

// Client presentation for the products list. The server page (page.tsx) does
// auth + data fetching and hands the results here so the whole view can be
// translated with react-i18next.
export function ProductsListView({
  products,
  total,
  totalPages,
  page,
  incompleteCount,
  isClientStats,
  initialFilters,
  prevHref,
  nextHref,
}: ProductsListViewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('products.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('products.count', { count: total })}
            {incompleteCount > 0 &&
              ` • ${
                isClientStats
                  ? t('products.incompleteCurrentPage', { count: incompleteCount })
                  : t('products.incomplete', { count: incompleteCount })
              }`}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="w-4 h-4 mr-2" />
            {t('products.newProduct')}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <ProductsFilters initialValues={initialFilters} />

      {/* Products table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('products.columns.image')}</TableHead>
              <TableHead>{t('products.columns.name')}</TableHead>
              <TableHead>{t('products.columns.category')}</TableHead>
              <TableHead>{t('products.columns.price')}</TableHead>
              <TableHead>{t('products.columns.availability')}</TableHead>
              <TableHead>{t('products.columns.status')}</TableHead>
              <TableHead>{t('products.columns.completeness')}</TableHead>
              <TableHead className="text-right">{t('products.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const completeness = rowCompleteness(product);
              return (
                <TableRow key={product.id} className="hover:bg-muted/50">
                  {/* Image */}
                  <TableCell>
                    {product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted" />
                    )}
                  </TableCell>

                  {/* Name */}
                  <TableCell>
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="block max-w-[280px] font-medium text-foreground hover:underline"
                    >
                      <span className="line-clamp-2 break-words">{product.name}</span>
                      <span className="block text-xs text-muted-foreground">{product.slug}</span>
                    </Link>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="text-sm text-muted-foreground">
                    {product.category?.name ?? '—'}
                  </TableCell>

                  {/* Price — salePrice active, regular struck-through when set */}
                  <TableCell className="whitespace-nowrap text-sm text-foreground">
                    {product.salePrice != null ? (
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-green-600">
                          {formatPrice(product.salePrice)}
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-medium">{formatPrice(product.price)}</span>
                    )}
                  </TableCell>

                  {/* Availability — numeric quantity in track mode, else in/out */}
                  <TableCell className="whitespace-nowrap">
                    {product.trackQuantity ? (
                      <Badge
                        variant="secondary"
                        className={
                          product.quantity > 0
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }
                      >
                        {t('products.availability.units', { count: product.quantity })}
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className={
                          product.isAvailable
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }
                      >
                        {product.isAvailable
                          ? t('products.availability.inStock')
                          : t('products.availability.outOfStock')}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="whitespace-nowrap">
                    <ProductStatusBadge status={product.status} />
                  </TableCell>

                  {/* Completeness */}
                  <TableCell className="whitespace-nowrap">
                    <CompletenessBar data={completeness} showPercent />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end">
                      <ProductRowActions productId={product.id} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {products.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">{t('products.empty')}</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={prevHref}>{t('products.pagination.back')}</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {t('products.pagination.back')}
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            {t('products.pagination.pageOf', { page, total: totalPages })}
          </span>
          {page < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={nextHref}>{t('products.pagination.forward')}</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {t('products.pagination.forward')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
