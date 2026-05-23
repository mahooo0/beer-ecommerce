"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  weight: string;
  image: string;
  qty: number;
  oldPrice: number;
  newPrice: number;
}

interface CartState {
  items: CartItem[];
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
      addItem: (product, qty = 1) =>
        set((state) => {
          const existing = state.items.find((it) => it.id === product.id);
          if (existing) {
            return {
              items: state.items.map((it) =>
                it.id === product.id ? { ...it, qty: it.qty + qty } : it
              ),
            };
          }
          return { items: [...state.items, { ...product, qty }] };
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((it) => it.id !== id) })),
      updateQty: (id, delta) =>
        set((state) => ({
          items: state.items.map((it) =>
            it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it
          ),
        })),
      setQty: (id, qty) =>
        set((state) => ({
          items: state.items.map((it) =>
            it.id === id ? { ...it, qty: Math.max(1, qty) } : it
          ),
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, it) => s + it.newPrice * it.qty, 0),
      count: () => get().items.reduce((s, it) => s + it.qty, 0),
    }),
    { name: "taranka-cart" }
  )
);
