import type { Metadata } from "next";
import Link from "next/link";
import { CatalogSidebar, type SidebarCategory } from "@/components/taranka/catalog-sidebar";
import { CatalogToolbar } from "@/components/taranka/catalog-toolbar";
import { CatalogCard, type CatalogProduct } from "@/components/taranka/catalog-card";
import { CatalogFilters } from "@/components/taranka/catalog-filters";
import { TarankaAbout } from "@/components/taranka/about";
import { TarankaFooter } from "@/components/taranka/footer";
import { api } from "@/lib/api";
import { toCatalogProducts } from "@/lib/product-mapper";
import type { Category, Product } from "@repo/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog | Taranka",
  description: "Katalog produktów Taranka",
};

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
  priceRange: { min: 0, max: 999999 },
};

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
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

  // Active category → materialized path (for filtering).
  let activeCategory: Category | null = null;
  if (query.category) {
    try {
      const result = await api.categories.getBySlug(query.category);
      activeCategory = result.data || null;
    } catch {
      activeCategory = null;
    }
  }

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
        priceRange?: { min: number; max: number };
      };
      facetCounts = {
        brands: (raw.brands || []).map((b) => ({ id: b.id, name: b.name || b.id, count: b.count })),
        priceRange: raw.priceRange || { min: 0, max: 999999 },
      };
    }
  } catch {
    products = [];
  }

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v && k !== "page") params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  const heading =
    activeCategory?.name || (query.search ? `Wyniki: ${query.search}` : "Wszystkie produkty");

  // Cap the visible page links so an un-narrowed catalog doesn't render 100+ buttons.
  const MAX_PAGE_LINKS = 8;
  const pageStart = Math.max(1, Math.min(page - 3, totalPages - MAX_PAGE_LINKS + 1));
  const pageNumbers = Array.from(
    { length: Math.min(MAX_PAGE_LINKS, totalPages) },
    (_, i) => pageStart + i,
  ).filter((p) => p >= 1 && p <= totalPages);

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-8 font-taranka-body">
        <div className="flex gap-6">
          <div className="hidden shrink-0 space-y-6 lg:block">
            <CatalogSidebar categories={sidebarCategories} activeSlug={query.category} />
            <CatalogFilters priceRange={facetCounts.priceRange} brands={facetCounts.brands} />
          </div>

          <div className="flex-1">
            <h1 className="mb-6 font-taranka-display text-[32px] font-extrabold uppercase leading-none text-ink-900">
              {heading}
            </h1>

            <CatalogToolbar shown={products.length} total={total} sort={query.sort} />

            {products.length === 0 ? (
              <div className="mt-16 flex flex-col items-center justify-center rounded-2xl bg-[#E2DFD4] py-20 text-center">
                <p className="text-lg font-semibold text-ink-900">Brak produktów</p>
                <p className="mt-2 text-sm text-[#5f5b52]">
                  Nie znaleźliśmy produktów spełniających wybrane kryteria.
                </p>
              </div>
            ) : (
              <div className="mt-9 flex flex-wrap gap-6">
                {products.map((p) => (
                  <CatalogCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginacja">
                {pageNumbers.map((p) => (
                  <Link
                    key={p}
                    href={buildPageHref(p)}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-brand-red-500 text-cream-50"
                        : "bg-[#E2DFD4] text-ink-900 hover:bg-[#cfccbf]"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </div>
      <TarankaAbout />
      <TarankaFooter />
    </>
  );
}
