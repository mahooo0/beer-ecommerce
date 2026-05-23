'use client';

import { useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useCartStore } from '@/stores/cart-store';

export function useCartSync() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const setItems = useCartStore((s) => s.setItems);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || syncedRef.current) return;

    const sync = async () => {
      syncedRef.current = true;

      try {
        const token = await getToken();
        if (!token) return;

        if (items.length > 0) {
          // Await the merge POST before fetching — prevents stale cart data (Pitfall 3)
          await fetch('/api/cart/merge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ items, couponCode }),
          });
        }

        // After merge completes, fetch authoritative server cart
        const res = await fetch('/api/cart', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = (await res.json()) as {
            data?: {
              items?: import('@repo/types').CartItem[];
              couponCode?: string | null;
              discountAmount?: number;
            };
          };
          if (data.data) {
            if (data.data.items && Array.isArray(data.data.items)) {
              setItems(data.data.items);
            }
            if (data.data.couponCode && data.data.discountAmount !== undefined) {
              applyCoupon(data.data.couponCode, data.data.discountAmount);
            }
          }
        }
      } catch {
        // Silently fail — local state remains intact
      }
    };

    void sync();
  }, [isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps
}
