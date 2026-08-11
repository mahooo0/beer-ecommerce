"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "@clerk/nextjs";
import { sortedWholesaleTiers, type WholesaleTier } from "@repo/types";
import { useCart } from "@/lib/cart-store";
import { TarankaFavoriteButton } from "./favorite-button";

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
  const { user } = useUser();
  const href = `/products/${product.slug ?? product.id}`;

  // Favorites are localStorage-backed (works for guests and signed-in users);
  // the shared button owns all the toggle/server-sync logic.
  const productId = String(product.id);
  const favPriceCents = product.basePriceCents ?? Math.round(parsePrice(product.newPrice) * 100);

  const outOfStock = product.inStock === false;
  const isWholesale =
    ((user?.publicMetadata?.customerType as string | undefined) ??
      (user?.unsafeMetadata?.customerType as string | undefined)) === "WHOLESALE";
  const tiers = product.wholesaleTiers ?? [];
  const showWholesale = isWholesale && tiers.length > 0;
  const bestUnit = showWholesale
    ? Math.min(...sortedWholesaleTiers(tiers).map((tier) => tier.unitPrice))
    : 0;

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
      className={`group relative flex h-[372px] w-[282px] flex-col rounded-[20px] bg-white px-6 pb-6 pt-4 transition-all duration-300 ${
        outOfStock
          ? "opacity-75"
          : "hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(39,36,34,0.18)]"
      }`}
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
          <TarankaFavoriteButton productId={productId} priceCents={favPriceCents} />
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
    </article>
  );
}
