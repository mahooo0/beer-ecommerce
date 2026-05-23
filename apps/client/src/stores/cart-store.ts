import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@repo/types';

interface CartStore {
  items: CartItem[];
  couponCode: string | null;
  discountAmount: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  subtotal: () => number;
  setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discountAmount: 0,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId),
          ),
        })),

      updateQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i,
          ),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      applyCoupon: (code, discount) => set({ couponCode: code, discountAmount: discount }),

      removeCoupon: () => set({ couponCode: null, discountAmount: 0 }),

      subtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      setItems: (items) => set({ items }),
    }),
    { name: 'cart-storage' },
  ),
);
