"use client";

import Link from "next/link";
import { Heart, Check } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useUser, useAuth } from "@clerk/nextjs";
import { sortedWholesaleTiers, type WholesaleTier } from "@repo/types";
import { useCart } from "@/lib/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { api } from "@/lib/api";

export interface CatalogProduct {
  id: number | string;
  /** URL slug used for the product detail link; falls back to `id` when absent. */
  slug?: string;
  name: string;
  weight: string;
  oldPrice: string;
  newPrice: string;
  image: string;
  /** false → out of stock: card is greyed, add-to-cart disabled. Defaults to in-stock. */
  inStock?: boolean;
  /** Retail unit price in cents — lets the cart apply wholesale tiers by quantity. */
  basePriceCents?: number;
  /** Wholesale quantity tiers (cents); only surfaced to WHOLESALE customers. */
  wholesaleTiers?: WholesaleTier[];
}

const parsePrice = (str: string) => parseFloat(str.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
const fmtZl = (cents: number) => `${(cents / 100).toFixed(2)} zł`;

export function CatalogCard({ product }: { product: CatalogProduct }) {
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const { t } = useTranslation("catalog");
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const href = `/products/${product.slug ?? product.id}`;

  // ---- Favorites (localStorage-backed, works for guests and signed-in users) ----
  const productId = String(product.id);
  const favPriceCents = product.basePriceCents ?? Math.round(parsePrice(product.newPrice) * 100);
  const items = useWishlistStore((s) => s.items);
  const toggleFavorite = useWishlistStore((s) => s.toggleItem);
  const addFavorite = useWishlistStore((s) => s.addItem);
  const removeFavorite = useWishlistStore((s) => s.removeItem);
  // Guard against SSR/client hydration mismatch: the persisted store is only
  // known on the client, so render "not favorited" until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isFavorite = mounted && items.some((i) => i.productId === productId);

  const handleToggleFavorite = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const wasFavorite = items.some((i) => i.productId === productId);
    toggleFavorite(productId, favPriceCents); // localStorage is the source of truth

    // Signed-in users additionally get server-side persistence; on failure we
    // roll the local change back so the two never drift apart.
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      if (wasFavorite) {
        await api.wishlist.removeItem(productId, token);
      } else {
        await api.wishlist.addItem(productId, favPriceCents, token);
      }
    } catch {
      if (wasFavorite) {
        addFavorite({ productId, priceAtAdd: favPriceCents });
      } else {
        removeFavorite(productId);
      }
    }
  };

  const outOfStock = product.inStock === false;
  const isWholesale =
    ((user?.publicMetadata?.customerType as string | undefined) ??
      (user?.unsafeMetadata?.customerType as string | undefined)) === "WHOLESALE";
  const tiers = product.wholesaleTiers ?? [];
  const showWholesale = isWholesale && tiers.length > 0;
  // Sorted tier rows (ascending minQty, per-unit rate derived) — used both for
  // the "hurt od …" teaser and the hover panel that drops out below the card.
  const wholesaleRows = showWholesale ? sortedWholesaleTiers(tiers) : [];
  const bestUnit = wholesaleRows.length ? Math.min(...wholesaleRows.map((r) => r.unitPrice)) : 0;

  const handleAdd = () => {
    if (outOfStock) return;
    addItem({
      id: String(product.id),
      name: product.name,
      weight: product.weight,
      image: product.image,
      oldPrice: parsePrice(product.oldPrice),
      newPrice: parsePrice(product.newPrice),
      basePriceCents: product.basePriceCents,
      tiers,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article
      className={`group relative flex h-[372px] w-[282px] flex-col rounded-[20px] bg-white px-6 pb-6 pt-4 transition-all duration-300 hover:z-20 ${
        outOfStock
          ? "opacity-75"
          : "hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(39,36,34,0.18)]"
      } ${showWholesale ? "group-hover:rounded-b-none" : ""}`}
    >
      <Link
        href={href}
        className="relative flex h-[174px] w-full cursor-pointer items-center justify-center overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className={`h-full w-auto object-contain transition-transform duration-500 ${
            outOfStock ? "grayscale" : "group-hover:scale-110"
          }`}
        />
        {outOfStock && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-[#443029]/85 py-1.5 text-sm font-medium text-cream-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {t("card.outOfStock")}
          </span>
        )}
      </Link>

      <div className="mt-[15px] flex flex-1 flex-col">
        <Link
          href={href}
          className="text-base font-semibold leading-tight text-[#443029] transition-colors group-hover:text-brand-red-500"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-sm text-[#443029]">{product.weight}</p>

        <div className="mt-1 flex items-baseline gap-4">
          {product.oldPrice && (
            <span className="text-base text-[#B5B2A7] line-through">{product.oldPrice}</span>
          )}
          <span className="text-xl font-bold text-[#443029]">{product.newPrice}</span>
        </div>
        {showWholesale && bestUnit > 0 && (
          <p className="mt-0.5 text-xs font-medium text-brand-red-500">
            hurt od {fmtZl(bestUnit)}/szt
          </p>
        )}

        <div className="mt-auto flex items-center gap-4">
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? t("card.removeFromFavorites") : t("card.addToFavorites")}
            className={`flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-red-500 transition-all duration-300 hover:scale-110 hover:bg-brand-red-500 hover:text-cream-50 active:scale-95 ${
              isFavorite ? "bg-brand-red-500 text-cream-50" : "text-brand-red-500"
            }`}
          >
            <Heart
              className="size-6"
              strokeWidth={1.75}
              fill={isFavorite ? "currentColor" : "none"}
            />
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock}
            className={`inline-flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-base font-medium transition-all duration-300 ${
              outOfStock
                ? "cursor-not-allowed bg-[#D8D4CB] text-[#7C776C]"
                : "bg-brand-red-500 text-cream-50 shadow-[0_0_0_0_rgba(170,60,55,0.4)] hover:-translate-y-0.5 hover:bg-brand-red-700 hover:shadow-[0_8px_24px_-4px_rgba(170,60,55,0.5)] active:translate-y-0"
            }`}
          >
            {outOfStock ? (
              t("card.outOfStock")
            ) : added ? (
              <>
                <Check className="size-4" strokeWidth={2.5} /> {t("card.added")}
              </>
            ) : (
              t("card.addToCart")
            )}
          </button>
        </div>
      </div>

      {/* Wholesale tier panel: drops out below the card on hover (overlapping the
          card underneath) and lists the per-unit price at each quantity break.
          Only mounted for WHOLESALE customers with tiers. */}
      {showWholesale && wholesaleRows.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-full z-10 origin-top overflow-hidden rounded-b-[20px] bg-white px-6 pb-5 opacity-0 shadow-[0_24px_48px_-12px_rgba(39,36,34,0.18)] transition-all duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
          <div className="border-t border-[#EFEAE0] pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-red-500">
              Ceny hurtowe
            </p>
            <ul className="space-y-1.5">
              {wholesaleRows.map((r) => (
                <li key={r.minQty} className="flex items-baseline justify-between text-sm">
                  <span className="text-[#7C776C]">od {r.minQty} szt</span>
                  <span className="font-semibold text-[#443029]">{fmtZl(r.unitPrice)}/szt</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </article>
  );
}
