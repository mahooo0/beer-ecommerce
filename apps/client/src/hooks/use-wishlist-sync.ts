'use client';

import { useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useWishlistStore } from '@/stores/wishlist-store';
import { api } from '@/lib/api';

export function useWishlistSync() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const items = useWishlistStore((s) => s.items);
  const addItem = useWishlistStore((s) => s.addItem);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || syncedRef.current) return;

    const sync = async () => {
      syncedRef.current = true;

      try {
        const token = await getToken();
        if (!token) return;

        if (items.length > 0) {
          // Fire-and-forget: sync local guest items to server
          api.wishlist.sync(items, token).catch(() => {
            // Silently fail — local state remains intact
          });
        }

        // Fetch full wishlist from server to update local store
        const res = await api.wishlist.get(token);
        const serverItems = res.data;
        if (Array.isArray(serverItems)) {
          serverItems.forEach((item) => {
            addItem({ productId: item.productId, priceAtAdd: item.priceAtAdd });
          });
        }
      } catch {
        // Silently fail — local state remains intact
      }
    };

    void sync();
  }, [isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps
}
