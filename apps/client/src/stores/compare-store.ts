import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CompareItem {
  productId: string;
  name: string;
  imageUrl: string;
  slug: string;
}

interface CompareStore {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: CompareItem) => void;
  hasItem: (productId: string) => boolean;
  clearItems: () => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) {
            return state;
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      toggleItem: (item) => {
        const { hasItem, removeItem, addItem } = get();
        if (hasItem(item.productId)) {
          removeItem(item.productId);
        } else {
          addItem(item);
        }
      },

      hasItem: (productId) => get().items.some((i) => i.productId === productId),

      clearItems: () => set({ items: [] }),
    }),
    {
      name: 'compare-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
