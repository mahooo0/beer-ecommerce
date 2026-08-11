import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TarankaProductDetail, type ProductDetailData } from "@/components/taranka/product-detail";
import { TarankaProductDescription } from "@/components/taranka/product-description";
import { TarankaProductRow } from "@/components/taranka/product-row";
import type { CatalogProduct } from "@/components/taranka/catalog-card";
import { TarankaAbout } from "@/components/taranka/about";
import { TarankaFooter } from "@/components/taranka/footer";
import { api } from "@/lib/api";
import { toCatalogProducts, resolvePrices } from "@/lib/product-mapper";
import type { Product, WholesaleTier } from "@repo/types";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// The server response is richer than the base Product type (variants, stock, salePrice…).
type RawProduct = Product & {
  salePrice?: number | null;
  attributes?: Record<string, unknown>;
  variants?: Array<{ stock?: number; isActive?: boolean }>;
  quantity?: number;
  trackQuantity?: boolean;
  isAvailable?: boolean;
  wholesaleTiers?: WholesaleTier[];
};

function resolveStock(raw: RawProduct): number | null {
  const variants = Array.isArray(raw.variants) ? raw.variants : [];
  if (variants.length) return variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  // Simple products track their own quantity only when trackQuantity is on.
  if (raw.trackQuantity && typeof raw.quantity === "number") return raw.quantity;
  // Not stock-tracked: reflect availability, but never show a misleading "0".
  if (raw.isAvailable === false) return 0;
  return null;
}

function toDetail(raw: RawProduct): ProductDetailData {
  const images = Array.isArray(raw.images) ? raw.images : [];

  const attrs =
    raw.attributes && typeof raw.attributes === "object" ? (raw.attributes as Record<string, unknown>) : {};
  const specs = Object.entries(attrs)
    .filter(([, v]) => typeof v === "string" || typeof v === "number")
    .slice(0, 6)
    .map(([label, value]) => ({ label: `${label}:`, value: String(value) }));

  const weightEntry = specs.find((s) =>
    /waga|weight|gramatura|objęto|size/i.test(s.label)
  );

  const { currentCents, regularCents } = resolvePrices(raw);

  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    weight: weightEntry?.value ?? "",
    images,
    price: currentCents / 100,
    oldPrice: regularCents != null ? regularCents / 100 : undefined,
    basePriceCents: currentCents,
    wholesaleTiers: Array.isArray(raw.wholesaleTiers) ? raw.wholesaleTiers : [],
    stock: resolveStock(raw),
    specs,
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await api.products.getBySlug(slug);
    const p = res.data;
    if (!p) return { title: "Produkt nie znaleziony | Taranka" };
    return {
      title: `${p.name} | Taranka`,
      description: p.description?.slice(0, 160) || undefined,
    };
  } catch {
    return { title: "Produkt nie znaleziony | Taranka" };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let raw: RawProduct | null = null;
  try {
    const res = await api.products.getBySlug(slug);
    raw = (res.data as RawProduct) || null;
  } catch {
    notFound();
  }
  if (!raw) notFound();

  const detail = toDetail(raw);

  // Related products (same category / algorithmic) for the suggestion rows.
  let related: CatalogProduct[] = [];
  let alsoBought: CatalogProduct[] = [];
  try {
    const [relRes, fbtRes] = await Promise.all([
      api.products.getRelated(raw.id, 8).catch(() => ({ data: [] as Product[] })),
      api.products.getFrequentlyBoughtTogether(raw.id, 8).catch(() => ({ data: [] as Product[] })),
    ]);
    related = toCatalogProducts(relRes.data);
    alsoBought = toCatalogProducts(fbtRes.data);
  } catch {
    related = [];
  }

  // Fall back so a row is never empty when we do have related items.
  if (alsoBought.length === 0) alsoBought = related;

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-8 font-taranka-body">
        <TarankaProductDetail product={detail} />

        <div className="mt-16">
          <TarankaProductDescription description={raw.description} />
        </div>

        {related.length > 0 && (
          <div className="mt-20">
            <TarankaProductRow title="Zalecamy zapoznanie się z" products={related} />
          </div>
        )}

        {alsoBought.length > 0 && (
          <div className="mt-20">
            <TarankaProductRow title="Podobne produkty" products={alsoBought} />
          </div>
        )}
      </div>
      <TarankaAbout />
      <TarankaFooter />
    </>
  );
}
