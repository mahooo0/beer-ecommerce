"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";

/**
 * Empties the live cart once the customer lands on the success page after a
 * completed Stripe payment. Rendered by the (server) success page.
 */
export function CheckoutSuccessClear() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
