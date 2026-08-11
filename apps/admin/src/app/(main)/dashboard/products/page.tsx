import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import type { Product } from '@repo/types';
import {
  computeProductCompleteness,
  type ProductLike,
} from '@/lib/product-completeness';
import { ProductsListView } from './products-list-view';

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
    status: sp.status || 'ALL',
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
        status: sp.status || 'ALL',
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
    <ProductsListView
      products={products}
      total={total}
      totalPages={totalPages}
      page={page}
      incompleteCount={incompleteCount}
      isClientStats={isClientStats}
      initialFilters={{
        categoryId: sp.categoryId || '',
        status: sp.status || '',
        isAvailable: sp.isAvailable || '',
        minPrice: sp.minPrice || '',
        maxPrice: sp.maxPrice || '',
        completeness: sp.completeness || '',
        attributeValues: sp.attributeValues || '',
      }}
      prevHref={`/dashboard/products?${buildQuery({ page: String(page - 1) })}`}
      nextHref={`/dashboard/products?${buildQuery({ page: String(page + 1) })}`}
    />
  );
}
