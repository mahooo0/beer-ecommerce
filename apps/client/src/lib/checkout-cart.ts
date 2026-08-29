"use client";

import { useMemo } from "react";
import type { CartItem } from "@repo/types";
import { useCart } from "@/lib/cart-store";

/**
 * Single source of truth for the checkout flow.
 *
 * The live storefront fills the Taranka cart (Stack A, `taranka-cart`): items are
 * keyed by product id with major-unit prices and the retail/wholesale unit price
 * already baked into `newPrice`. The checkout flow and the order API, however,
 * speak the shared cents-based {@link CartItem} shape. This adapter bridges the
 * two so checkout reads the same cart the customer actually filled.
 *
 * Prices here are advisory/display-only: the server re-derives the authoritative
 * unit price (retail vs. wholesale) from the catalog at order time.
 */
export function useCheckoutItems(): CartItem[] {
  const items = useCart((s) => s.items);
  return useMemo(
    () =>
      items.map((it) => ({
        productId: it.id,
        name: it.name,
        sku: "", // server-authoritative — filled from the catalog at order time
        price: Math.round(it.newPrice * 100), // major units → cents
        quantity: it.qty,
        imageUrl: it.image,
        attributes: {},
      })),
    [items],
  );
}

/**
 * Checkout cart view: cents-based items plus a `subtotal()` accessor mirroring
 * the API the checkout flow previously consumed from the legacy store.
 */
export function useCheckoutCart(): { items: CartItem[]; subtotal: () => number } {
  const items = useCheckoutItems();
  const subtotal = useMemo(
    () => () => items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [items],
  );
  return { items, subtotal };
}
