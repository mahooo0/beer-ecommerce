'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart-store';
import { CheckoutFlow } from './checkout-flow';
import { WholesaleQuickOrder } from './wholesale-quick-order';

/**
 * Picks the checkout experience by customer type. WHOLESALE customers don't pay
 * online — they submit a "quick order" inquiry (Швидке замовлення). Everyone
 * else gets the normal retail checkout. The wholesale flag is synced into the
 * cart store from Clerk (see cart-wholesale-sync); it's only known on the
 * client, so we default to the retail flow until mounted to avoid a hydration
 * mismatch, then swap for wholesale accounts.
 */
export function CheckoutSwitch() {
  const isWholesale = useCart((s) => s.isWholesale);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (mounted && isWholesale) return <WholesaleQuickOrder />;
  return <CheckoutFlow />;
}
