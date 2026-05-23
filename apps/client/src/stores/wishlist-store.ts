import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistItem {
  productId: string;
  priceAtAdd: number; // cents — snapshot for price-drop badge
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string, priceAtAdd: number) => void;
  hasItem: (productId: string) => boolean;
  clearItems: () => void;
  totalItems: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) {
            return state; // dedup — skip if already exists
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      toggleItem: (productId, priceAtAdd) => {
        const { hasItem, removeItem, addItem } = get();
        if (hasItem(productId)) {
          removeItem(productId);
        } else {
          addItem({ productId, priceAtAdd });
        }
      },

      hasItem: (productId) => get().items.some((i) => i.productId === productId),

      clearItems: () => set({ items: [] }),

      totalItems: () => get().items.length,
    }),
    { name: 'wishlist-storage' },
  ),
);
