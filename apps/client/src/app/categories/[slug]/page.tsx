import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { ProductGrid } from '@/components/product/product-grid';
import { SortSelector } from '@/components/product/sort-selector';
import { Pagination } from '@/components/product/pagination';
import { FilterSidebar } from '@/components/filters/filter-sidebar';
import { FilterDrawer } from '@/components/filters/filter-drawer';
import { ActiveFilters } from '@/components/filters/active-filters';
import { api } from '@/lib/api';
import type { Category, CategoryAttribute } from '@repo/types';
import type { FilterContentProps } from '@/components/filters/filter-content';

type FacetCountsShape = FilterContentProps['facetCounts'];

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    minPrice?: string;
    maxPrice?: string;
    brands?: string;
    attributes?: string;
    availability?: string;
  }>;
}

const EMPTY_FACETS: FacetCountsShape = {
  brands: [],
  attributes: {},
  availability: {},
  priceRange: { min: 0, max: 999999 },
};

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;

  try {
    const result = await api.categories.getBySlug(slug);
    const category = result.data;

    if (!category) {
      return { title: 'Category Not Found' };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
    const canonicalUrl = `${siteUrl}/categories/${category.slug}`;

    // Determine if any filters are active
    const hasFilters =
      !!query.minPrice ||
      !!query.maxPrice ||
      !!query.brands ||
      !!query.attributes ||
      !!query.availability;

    return {
      title: category.metaTitle || category.name,
      description: category.metaDescription || category.description || undefined,
      alternates: { canonical: canonicalUrl },
      robots: hasFilters ? { index: false, follow: true } : undefined,
      openGraph: {
        title: category.metaTitle || category.name,
        description: category.metaDescription || category.description || undefined,
        url: canonicalUrl,
        type: 'website',
        images: category.image ? [{ url: category.image }] : [],
      },
    };
  } catch (error) {
    return { title: 'Category Not Found' };
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  // Parse filter values from URL query params
  const page = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '20', 10);
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = (query.sortOrder as 'asc' | 'desc') || 'desc';
  const minPrice = query.minPrice ? parseInt(query.minPrice, 10) : undefined;
  const maxPrice = query.maxPrice ? parseInt(query.maxPrice, 10) : undefined;
  const brands = query.brands ? query.brands.split(',').filter(Boolean) : undefined;
  const attributes = query.attributes ? query.attributes.split(',').filter(Boolean) : undefined;
  const availability = query.availability ? query.availability.split(',').filter(Boolean) : undefined;

  // Fetch category
  let category: Category | null = null;
  try {
    const result = await api.categories.getBySlug(slug);
    category = result.data || null;
  } catch (error) {
    notFound();
  }

  if (!category) {
    notFound();
  }

  const categoryAttributes: CategoryAttribute[] = (category as any).attributes || [];

  // Fetch all categories to find subcategories
  let subcategories: Category[] = [];
  try {
    const allCategoriesResult = await api.categories.getAll();
    const allCategories = allCategoriesResult.data || [];
    subcategories = allCategories.filter((cat) => cat.parentId === category!.id);
    subcategories.sort((a, b) => a.position - b.position);
  } catch (error) {
    console.error('Failed to fetch subcategories:', error);
  }

  const filterParams = {
    categoryPath: category.path,
    minPrice,
    maxPrice,
    brands,
    attributes,
    availability,
    page,
    limit,
    sortBy,
    sortOrder,
  };

  const facetsParams = {
    categoryPath: category.path,
    minPrice,
    maxPrice,
    brands,
    attributes,
    availability,
  };

  // Fetch filtered products and facet counts in parallel
  let products: any[] = [];
  let total = 0;
  let totalPages = 1;
  let facetCounts: FacetCountsShape = EMPTY_FACETS;

  try {
    const [productsResult, facetsResult] = await Promise.all([
      api.products.filter(filterParams),
      api.products.facets(facetsParams),
    ]);

    products = productsResult.data || [];
    total = productsResult.total || 0;
    totalPages = productsResult.totalPages || 1;

    if (facetsResult.data) {
      // Normalize facets to match FilterContent expected shape
      const raw = facetsResult.data;

      // Convert availability array [{status, count}] to object {in_stock?, out_of_stock?, pre_order?}
      const availabilityObj: { in_stock?: number; out_of_stock?: number; pre_order?: number } = {};
      (raw.availability || []).forEach((item: any) => {
        if (item.status === 'in_stock') availabilityObj.in_stock = item.count;
        if (item.status === 'out_of_stock') availabilityObj.out_of_stock = item.count;
        if (item.status === 'pre_order') availabilityObj.pre_order = item.count;
      });

      facetCounts = {
        brands: (raw.brands || []).map((b: any) => ({ name: b.name || b.id, count: b.count })),
        attributes: raw.attributes || {},
        availability: availabilityObj,
        priceRange: raw.priceRange || { min: 0, max: 999999 },
      };
    }
  } catch (error) {
    console.error('Failed to fetch filtered products or facets:', error);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs categorySlug={slug} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600 text-base">{category.description}</p>
        )}
      </div>

      {subcategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {subcategories.map((subcat) => (
              <a
                key={subcat.id}
                href={`/categories/${subcat.slug}`}
                className="group block rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-md transition-all"
              >
                {subcat.image && (
                  <div className="mb-3 aspect-square overflow-hidden rounded-md bg-gray-100">
                    <img
                      src={subcat.image}
                      alt={subcat.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <h3 className="text-sm font-medium text-gray-900 text-center">
                  {subcat.name}
                </h3>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Two-column layout: sidebar (desktop) + main content */}
      <div className="flex gap-8">
        {/* Filter Sidebar - desktop only */}
        <FilterSidebar
          categoryAttributes={categoryAttributes}
          facetCounts={facetCounts}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter button + sort selector row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* FilterDrawer trigger (mobile only) */}
              <FilterDrawer
                categoryAttributes={categoryAttributes}
                facetCounts={facetCounts}
              />
              <span className="text-sm text-gray-600">
                {total} product{total !== 1 ? 's' : ''} found
              </span>
            </div>
            <SortSelector currentSort={sortBy} currentOrder={sortOrder} />
          </div>

          {/* Active filter chips */}
          <Suspense fallback={null}>
            <div className="mb-4">
              <ActiveFilters />
            </div>
          </Suspense>

          <ProductGrid products={products} />

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath={`/categories/${slug}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
