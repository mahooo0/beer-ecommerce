"use client";

import { Heart } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useUser, useAuth } from "@clerk/nextjs";
import { useWishlistStore } from "@/stores/wishlist-store";
import { api } from "@/lib/api";

interface TarankaFavoriteButtonProps {
  /** Real product id — the localStorage wishlist keys off this. */
  productId: string;
  /** Price snapshot in cents, used later for the price-drop badge. */
  priceCents: number;
  /** Extra classes merged onto the round button (e.g. sizing overrides). */
  className?: string;
  /** Heart icon sizing utility. */
  iconClassName?: string;
}

/**
 * The heart toggle shared by every Taranka product card (catalog grid, product
 * detail, popular slider). localStorage is the source of truth so it works for
 * guests; signed-in users additionally get server-side persistence, and on a
 * failed request the local change is rolled back so the two never drift apart.
 */
export function TarankaFavoriteButton({
  productId,
  priceCents,
  className = "",
  iconClassName = "size-6",
}: TarankaFavoriteButtonProps) {
  const { t } = useTranslation("catalog");
  const items = useWishlistStore((s) => s.items);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const addItem = useWishlistStore((s) => s.addItem);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  // Guard against SSR/client hydration mismatch: the persisted store is only
  // known on the client, so render "not favorited" until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isFavorite = mounted && items.some((i) => i.productId === productId);

  const handleToggle = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const wasFavorite = items.some((i) => i.productId === productId);
    toggleItem(productId, priceCents); // localStorage is the source of truth

    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      if (wasFavorite) {
        await api.wishlist.removeItem(productId, token);
      } else {
        await api.wishlist.addItem(productId, priceCents, token);
      }
    } catch {
      // Roll the local change back so client and server stay consistent.
      if (wasFavorite) {
        addItem({ productId, priceAtAdd: priceCents });
      } else {
        removeItem(productId);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? t("card.removeFromFavorites") : t("card.addToFavorites")}
      className={`flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-red-500 transition-all duration-300 hover:scale-110 hover:bg-brand-red-500 hover:text-cream-50 active:scale-95 ${
        isFavorite ? "bg-brand-red-500 text-cream-50" : "text-brand-red-500"
      } ${className}`}
    >
      <Heart className={iconClassName} strokeWidth={1.75} fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );
}
