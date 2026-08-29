"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useCart } from "@/lib/cart-store";
import { setAnalyticsIdentity } from "@/lib/analytics";

/**
 * Keeps the Taranka cart's `isWholesale` flag in sync with the signed-in user's
 * Clerk customerType, app-wide. Mounted once in the client layout so catalog
 * cards, mini-cart and cart page all re-price consistently — not only after a
 * visit to a product detail page. Renders nothing.
 */
export function CartWholesaleSync() {
  const { isSignedIn, user } = useUser();
  const setWholesale = useCart((s) => s.setWholesale);

  useEffect(() => {
    const customerType =
      (user?.publicMetadata?.customerType as string | undefined) ??
      (user?.unsafeMetadata?.customerType as string | undefined);
    const isWholesale = Boolean(isSignedIn) && customerType === "WHOLESALE";
    setWholesale(isWholesale);
    // Feed the same identity to analytics so cart-store beacons can attribute
    // events to the signed-in user (best-effort; not an auth signal).
    setAnalyticsIdentity({ userId: isSignedIn ? user?.id ?? null : null, isWholesale });
  }, [isSignedIn, user, setWholesale]);

  return null;
}
