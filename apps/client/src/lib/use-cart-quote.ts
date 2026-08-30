"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { api, type OrderQuote } from "@/lib/api";

/**
 * Fetches the server-authoritative price preview (loyalty + wholesale) for a set
 * of cart lines, so the cart and checkout can show the real discount BEFORE an
 * order exists. Re-quotes (debounced) when the lines change and when auth
 * resolves — a signed-in RETAIL customer sees their loyalty %, wholesale sees
 * tier savings, guests see plain retail.
 *
 * Errors fall back to a null quote; callers keep their locally-computed subtotal
 * so the UI never blocks on this network round-trip.
 */
export function useCartQuote(
  lines: Array<{ productId: string; quantity: number }>,
): OrderQuote | null {
  const { isSignedIn, getToken } = useAuth();
  const [quote, setQuote] = useState<OrderQuote | null>(null);

  // Stable signature so the effect only re-fires on a genuine cart change, not
  // on every render (the `lines` array is rebuilt each time).
  const sig = lines
    .map((l) => `${l.productId}:${l.quantity}`)
    .sort()
    .join("|");

  useEffect(() => {
    if (!sig) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    const items = sig.split("|").map((pair) => {
      const idx = pair.lastIndexOf(":");
      return { productId: pair.slice(0, idx), quantity: Number(pair.slice(idx + 1)) };
    });
    const handle = setTimeout(async () => {
      try {
        const token = isSignedIn ? (await getToken()) ?? undefined : undefined;
        const res = await api.orders.quote({ items }, token);
        if (!cancelled && res.success && res.data) setQuote(res.data);
      } catch {
        if (!cancelled) setQuote(null);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, isSignedIn]);

  return quote;
}
