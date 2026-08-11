import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Zod is the single source of truth for what a persisted favorite looks like.
// Everything lives in localStorage (guests and signed-in users alike), so the
// data can be stale, hand-edited, or written by an older app version — we parse
// it defensively on rehydrate and silently drop anything that no longer fits.
// ---------------------------------------------------------------------------
export const wishlistItemSchema = z.object({
  productId: z.string().min(1),
  priceAtAdd: z.number().int().nonnegative(), // cents — snapshot for the price-drop badge
});

export type WishlistItem = z.infer<typeof wishlistItemSchema>;

/** Keep only valid, de-duplicated items out of arbitrary persisted input. */
function sanitizeItems(input: unknown): WishlistItem[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: WishlistItem[] = [];
  for (const candidate of input) {
    const parsed = wishlistItemSchema.safeParse(candidate);
    if (!parsed.success) continue;
    if (seen.has(parsed.data.productId)) continue;
    seen.add(parsed.data.productId);
    out.push(parsed.data);
  }
  return out;
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
          const parsed = wishlistItemSchema.safeParse(item);
          if (!parsed.success) return state; // never let an invalid item into the store
          if (state.items.some((i) => i.productId === parsed.data.productId)) {
            return state; // dedup — skip if already exists
          }
          return { items: [...state.items, parsed.data] };
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
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
      // Zod boundary: whatever comes back from localStorage is untrusted. Parse
      // each item, drop the invalid ones, and merge the survivors onto defaults.
      merge: (persisted, current) => {
        const raw = (persisted ?? {}) as { items?: unknown };
        return { ...current, items: sanitizeItems(raw.items) };
      },
    },
  ),
);
