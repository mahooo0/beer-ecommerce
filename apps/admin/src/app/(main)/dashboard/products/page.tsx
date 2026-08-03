import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { Product } from '@repo/types';
import {
  computeProductCompleteness,
  type ProductLike,
} from '@/lib/product-completeness';
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

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    categoryId?: string;
    isAvailable?: string; // 'in' | 'out'
    minPrice?: string;
    maxPrice?: string;
    completeness?: string; // 'complete' | 'incomplete'
    attributeValues?: string; // comma-separated AttributeValue ids
  }>;
}

// Admin-only per-row annotations the catalog filter endpoint may attach.
type ProductRow = Product & {
  category?: { id: string; name: string } | null;
  categoryAttrCount?: number;
  productAttrFilledCount?: number;
};

const PAGE_SIZE = 20;

function formatPrice(cents: number) {
  return `${(cents / 100).toFixed(2)} ₴`;
}

function rowCompleteness(product: ProductRow) {
  return computeProductCompleteness(product as ProductLike, {
    attributesNeeded: product.categoryAttrCount ?? 0,
    attributesFilled: product.productAttrFilledCount ?? 0,
  });
}

export default async function ProductsPage(props: PageProps) {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect('/sign-in');
  }

  const sp = await props.searchParams;
  const page = Number(sp.page) || 1;

  // Map the URL filter contract onto api.products.filter (lib/api.ts).
  const isAvailableParam =
    sp.isAvailable === 'in' ? true : sp.isAvailable === 'out' ? false : undefined;
  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const completenessFilter =
    sp.completeness === 'complete' || sp.completeness === 'incomplete'
      ? sp.completeness
      : undefined;

  const filterParams = {
    page,
    limit: PAGE_SIZE,
    status: sp.status || undefined,
    categoryId: sp.categoryId || undefined,
    isAvailable: isAvailableParam,
    minPrice,
    maxPrice,
    completenessFilter,
    attributeValues: sp.attributeValues || undefined,
    token,
  } as const;

  const [response, statsRes] = await Promise.all([
    api.products.filter(filterParams),
    api.products
      .completenessStats({
        status: sp.status || undefined,
        categoryId: sp.categoryId || undefined,
        isAvailable: isAvailableParam,
        attributeValues: sp.attributeValues || undefined,
        token,
      })
      .catch(() => null),
  ]);

  const products = (response.data || []) as ProductRow[];
  const total = response.total ?? products.length;
  const totalPages = response.totalPages || 1;

  // Server stats win (whole result set); fall back to a per-page client compute
  // when /completeness-stats isn't reachable.
  const serverStats = statsRes?.data ?? null;
  const clientIncomplete = products.filter(
    (p) => rowCompleteness(p).percent < 100,
  ).length;
  const incompleteCount = serverStats?.incomplete ?? clientIncomplete;
  const isClientStats = !serverStats;

  // Build a query string preserving the active filters (used for pagination).
  function buildQuery(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      status: sp.status,
      categoryId: sp.categoryId,
      isAvailable: sp.isAvailable,
      minPrice: sp.minPrice,
      maxPrice: sp.maxPrice,
      completeness: sp.completeness,
      attributeValues: sp.attributeValues,
      page: String(page),
      ...overrides,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    return params.toString();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Товари</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} товарів
            {incompleteCount > 0 &&
              ` • ${incompleteCount} не заповнено повністю${
                isClientStats ? ' (за поточну сторінку)' : ''
              }`}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="w-4 h-4 mr-2" />
            Новий товар
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <ProductsFilters
        initialValues={{
          categoryId: sp.categoryId || '',
          status: sp.status || '',
          isAvailable: sp.isAvailable || '',
          minPrice: sp.minPrice || '',
          maxPrice: sp.maxPrice || '',
          completeness: sp.completeness || '',
          attributeValues: sp.attributeValues || '',
        }}
      />

      {/* Products table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Зображення</TableHead>
              <TableHead>Назва</TableHead>
              <TableHead>Категорія</TableHead>
              <TableHead>Ціна</TableHead>
              <TableHead>Наявність</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Заповнення</TableHead>
              <TableHead className="text-right">Дії</TableHead>
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
                      <span className="block text-xs text-muted-foreground">
                        {product.slug}
                      </span>
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
                        {product.quantity} шт
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
                        {product.isAvailable ? 'В наявності' : 'Немає'}
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
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Редагувати
                      </Link>
                      <ProductRowActions productId={product.id} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {products.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Товарів не знайдено.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/products?${buildQuery({ page: String(page - 1) })}`}>
                Назад
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Назад
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Сторінка {page} з {totalPages}
          </span>
          {page < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/products?${buildQuery({ page: String(page + 1) })}`}>
                Далі
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Далі
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
