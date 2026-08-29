"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { resolveWholesaleUnitPrice, type WholesaleTier } from "@repo/types";
import { track, AnalyticsEventType } from "@/lib/analytics";

export interface CartItem {
  id: string;
  name: string;
  weight: string;
  image: string;
  qty: number;
  oldPrice: number; // major units — crossed-out / retail price
  newPrice: number; // major units — effective unit price (derived when tiers present)
  // Wholesale pricing inputs (optional; present for wholesale-capable products).
  basePriceCents?: number; // retail unit price in cents
  tiers?: WholesaleTier[]; // wholesale quantity tiers (cents)
}

/**
 * Effective unit price (major units) for a quantity, honoring the cart's
 * wholesale flag. Items added without pricing inputs keep their given newPrice.
 */
function unitPrice(
  item: Pick<CartItem, "newPrice" | "basePriceCents" | "tiers">,
  qty: number,
  isWholesale: boolean,
): number {
  if (item.basePriceCents == null) return item.newPrice;
  return (
    resolveWholesaleUnitPrice({
      basePrice: item.basePriceCents,
      tiers: item.tiers,
      quantity: qty,
      isWholesale,
    }) / 100
  );
}

interface CartState {
  items: CartItem[];
  // Mirrors the signed-in user's customerType === 'WHOLESALE' (synced from Clerk).
  isWholesale: boolean;
  setWholesale: (isWholesale: boolean) => void;
  addItem: (product: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isWholesale: false,

      // Re-price every line when the wholesale flag flips (login / logout).
      setWholesale: (isWholesale) =>
        set((state) => ({
          isWholesale,
          items: state.items.map((it) => ({
            ...it,
            newPrice: unitPrice(it, it.qty, isWholesale),
          })),
        })),

      addItem: (product, qty = 1) => {
        set((state) => {
          const wholesale = state.isWholesale;
          const existing = state.items.find((it) => it.id === product.id);
          if (existing) {
            const newQty = existing.qty + qty;
            const merged = { ...existing, ...product, qty: newQty };
            return {
              items: state.items.map((it) =>
                it.id === product.id
                  ? { ...merged, newPrice: unitPrice(merged, newQty, wholesale) }
                  : it,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...product, qty, newPrice: unitPrice(product, qty, wholesale) },
            ],
          };
        });
        const s = get();
        track(AnalyticsEventType.ADD_TO_CART, {
          productId: product.id,
          quantity: qty,
          itemCount: s.count(),
          valueCents: Math.round(s.total() * 100),
        });
      },

      removeItem: (id) => {
        const removedQty = get().items.find((it) => it.id === id)?.qty;
        set((state) => ({ items: state.items.filter((it) => it.id !== id) }));
        const s = get();
        track(AnalyticsEventType.REMOVE_FROM_CART, {
          productId: id,
          quantity: removedQty,
          itemCount: s.count(),
          valueCents: Math.round(s.total() * 100),
        });
      },

      updateQty: (id, delta) =>
        set((state) => ({
          items: state.items.map((it) => {
            if (it.id !== id) return it;
            const q = Math.max(1, it.qty + delta);
            return { ...it, qty: q, newPrice: unitPrice(it, q, state.isWholesale) };
          }),
        })),

      setQty: (id, qty) =>
        set((state) => ({
          items: state.items.map((it) => {
            if (it.id !== id) return it;
            const q = Math.max(1, qty);
            return { ...it, qty: q, newPrice: unitPrice(it, q, state.isWholesale) };
          }),
        })),

      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, it) => s + it.newPrice * it.qty, 0),
      count: () => get().items.reduce((s, it) => s + it.qty, 0),
    }),
    { name: "taranka-cart" },
  ),
);
