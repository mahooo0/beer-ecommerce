import type { Metadata } from "next";
import { CatalogSidebar, type SidebarCategory } from "@/components/taranka/catalog-sidebar";
import { CatalogToolbar } from "@/components/taranka/catalog-toolbar";
import { CatalogCard, type CatalogProduct } from "@/components/taranka/catalog-card";
import { CatalogFilters } from "@/components/taranka/catalog-filters";
import { CatalogPagination } from "@/components/taranka/catalog-pagination";
import { TarankaAbout } from "@/components/taranka/about";
import { TarankaFooter } from "@/components/taranka/footer";
import { api } from "@/lib/api";
import { toCatalogProducts } from "@/lib/product-mapper";
import { getServerT } from "@/lib/i18n/server";
import type { Category, CategoryAttribute, Product } from "@repo/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("catalog");
  return {
    title: t("page.metaTitle"),
    description: t("page.metaDescription"),
  };
}

const PAGE_SIZE = 12;

function resolveSort(sort?: string): { sortBy: string; sortOrder: "asc" | "desc" } {
  switch (sort) {
    case "price-asc":
      return { sortBy: "price", sortOrder: "asc" };
    case "name-asc":
      return { sortBy: "name", sortOrder: "asc" };
    case "popular":
    case "newest":
    default:
      return { sortBy: "createdAt", sortOrder: "desc" };
  }
}

const EMPTY_FACETS = {
  brands: [] as Array<{ id: string; name: string; count: number }>,
  attributes: {} as Record<string, Array<{ value: string; count: number }>>,
  priceRange: { min: 0, max: 999999 },
};

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const t = await getServerT("catalog");
  const query = await searchParams;
  const page = Math.max(1, parseInt(query.page || "1", 10) || 1);
  const { sortBy, sortOrder } = resolveSort(query.sort);

  const minPrice = query.minPrice ? parseInt(query.minPrice, 10) : undefined;
  const maxPrice = query.maxPrice ? parseInt(query.maxPrice, 10) : undefined;
  const brands = query.brands ? query.brands.split(",").filter(Boolean) : undefined;
  const attributes = query.attributes ? query.attributes.split(",").filter(Boolean) : undefined;
  const availability = query.availability ? query.availability.split(",").filter(Boolean) : undefined;

  // Sidebar categories (top-level only).
  let sidebarCategories: SidebarCategory[] = [];
  try {
    const catResult = await api.categories.getAll();
    sidebarCategories = (catResult.data || [])
      .filter((c) => !c.parentId)
      .sort((a, b) => a.position - b.position)
      .map((c) => ({ name: c.name, slug: c.slug }));
  } catch {
    sidebarCategories = [];
  }

  // Resolve the active category (if any) to its materialized path for filtering.
  let activeCategory: Category | null = null;
  if (query.category) {
    try {
      const result = await api.categories.getBySlug(query.category);
      activeCategory = result.data || null;
    } catch {
      activeCategory = null;
    }
  }

  // Per-category attribute definitions — the filter panel's attribute section is
  // built from these, so it changes whenever a different category is selected.
  // The API returns `attributes` on the category (not yet in the shared type).
  const categoryAttributes: CategoryAttribute[] =
    (activeCategory as (Category & { attributes?: CategoryAttribute[] }) | null)?.attributes ?? [];

  const filterParams = {
    categoryPath: activeCategory?.path,
    search: query.search,
    minPrice,
    maxPrice,
    brands,
    attributes,
    availability,
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortOrder,
  };
  const facetsParams = {
    categoryPath: activeCategory?.path,
    minPrice,
    maxPrice,
    brands,
    attributes,
    availability,
  };

  let products: CatalogProduct[] = [];
  let total = 0;
  let totalPages = 1;
  let facetCounts = EMPTY_FACETS;
  try {
    const [prodRes, facetsRes] = await Promise.all([
      api.products.filter(filterParams),
      api.products.facets(facetsParams),
    ]);
    products = toCatalogProducts((prodRes.data as Product[]) || []);
    total = prodRes.total ?? products.length;
    totalPages = prodRes.totalPages ?? 1;

    if (facetsRes.data) {
      const raw = facetsRes.data as {
        brands?: Array<{ id: string; name: string; count: number }>;
        attributes?: Record<string, Array<{ value: string; count: number }>>;
        priceRange?: { min: number; max: number };
      };
      facetCounts = {
        brands: (raw.brands || []).map((b) => ({ id: b.id, name: b.name || b.id, count: b.count })),
        attributes: raw.attributes || {},
        priceRange: raw.priceRange || { min: 0, max: 999999 },
      };
    }
  } catch {
    products = [];
  }

  const heading =
    activeCategory?.name ||
    (query.search ? t("page.searchResults", { query: query.search }) : t("page.allProducts"));

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-8 font-taranka-body">
        <div className="flex gap-6">
          <div className="hidden shrink-0 space-y-6 lg:block">
            <CatalogSidebar categories={sidebarCategories} activeSlug={query.category} />
            <CatalogFilters
              priceRange={facetCounts.priceRange}
              brands={facetCounts.brands}
              categoryAttributes={categoryAttributes}
              attributeFacets={facetCounts.attributes}
            />
          </div>

          <div className="flex-1">
            <h1 className="mb-6 font-taranka-display text-[32px] font-extrabold uppercase leading-none text-ink-900">
              {heading}
            </h1>

            <CatalogToolbar shown={products.length} total={total} sort={query.sort} />

            {products.length === 0 ? (
              <div className="mt-16 flex flex-col items-center justify-center rounded-2xl bg-[#E2DFD4] py-20 text-center">
                <p className="text-lg font-semibold text-ink-900">{t("page.emptyTitle")}</p>
                <p className="mt-2 text-sm text-[#5f5b52]">{t("page.emptyDescription")}</p>
              </div>
            ) : (
              <div className="mt-9 flex flex-wrap gap-6">
                {products.map((p) => (
                  <CatalogCard key={p.id} product={p} />
                ))}
              </div>
            )}

            <CatalogPagination
              currentPage={page}
              totalPages={totalPages}
              ariaLabel={t("page.pagination")}
            />
          </div>
        </div>
      </div>
      <TarankaAbout />
      <TarankaFooter />
    </>
  );
}
