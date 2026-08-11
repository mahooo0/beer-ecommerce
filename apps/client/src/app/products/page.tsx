import type { Metadata } from "next";
import Link from "next/link";
import { CatalogSidebar, type SidebarCategory } from "@/components/taranka/catalog-sidebar";
import { CatalogToolbar } from "@/components/taranka/catalog-toolbar";
import { CatalogCard, type CatalogProduct } from "@/components/taranka/catalog-card";
import { TarankaAbout } from "@/components/taranka/about";
import { TarankaFooter } from "@/components/taranka/footer";
import { api } from "@/lib/api";
import { toCatalogProducts } from "@/lib/product-mapper";
import { getServerT } from "@/lib/i18n/server";
import type { Category } from "@repo/types";

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

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; search?: string; sort?: string; page?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const t = await getServerT("catalog");
  const query = await searchParams;
  const page = Math.max(1, parseInt(query.page || "1", 10) || 1);
  const { sortBy, sortOrder } = resolveSort(query.sort);

  // Load the category list for the sidebar (top-level only).
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

  let products: CatalogProduct[] = [];
  let total = 0;
  let totalPages = 1;
  try {
    const result = await api.products.getAll({
      page,
      limit: PAGE_SIZE,
      sortBy,
      sortOrder,
      categoryPath: activeCategory?.path,
      search: query.search,
    });
    products = toCatalogProducts(result.data);
    total = result.total ?? products.length;
    totalPages = result.totalPages ?? 1;
  } catch {
    products = [];
  }

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    if (query.category) params.set("category", query.category);
    if (query.search) params.set("search", query.search);
    if (query.sort) params.set("sort", query.sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  const heading =
    activeCategory?.name ||
    (query.search ? t("page.searchResults", { query: query.search }) : t("page.allProducts"));

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-8 font-taranka-body">
        <div className="flex gap-6">
          <CatalogSidebar categories={sidebarCategories} activeSlug={query.category} />

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
              <div className="mt-9 grid grid-cols-3 gap-6">
                {products.map((p) => (
                  <CatalogCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav className="mt-12 flex items-center justify-center gap-2" aria-label={t("page.pagination")}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
