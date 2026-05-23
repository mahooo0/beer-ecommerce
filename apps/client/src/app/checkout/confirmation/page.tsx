'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCartStore } from '@/stores/cart-store';
import { useCheckoutStore } from '@/stores/checkout-store';
import type { Order } from '@repo/types';

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const clearCart = useCartStore((s) => s.clearCart);
  const resetCheckout = useCheckoutStore((s) => s.reset);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear cart and checkout state on mount
    clearCart();
    resetCheckout();

    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.orders.getById(orderId);
        if (res.success && res.data) {
          setOrder(res.data);
        }
      } catch {
        // Order might not be found yet if webhook hasn't processed
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-container px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <svg className="mx-auto size-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        <h1 className="mt-6 text-display-xs font-light text-neutral-900">Order Confirmed</h1>
        <p className="mt-3 text-neutral-500">
          Thank you for your purchase! Your order has been placed successfully.
        </p>

        {loading && (
          <div className="mt-6 animate-pulse">
            <div className="h-4 bg-neutral-100 rounded w-48 mx-auto" />
          </div>
        )}

        {order && (
          <div className="mt-6 bg-neutral-50 border border-neutral-200 p-6 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-500">Order Number</span>
              <span className="font-mono font-medium text-neutral-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Status</span>
              <span className="font-medium text-neutral-900 capitalize">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Total</span>
              <span className="font-medium text-neutral-900">${(order.totalAmount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Items</span>
              <span className="text-neutral-900">{order.items.length}</span>
            </div>
          </div>
        )}

        {!loading && !order && orderId && (
          <p className="mt-4 text-sm text-neutral-400">
            Your order is being processed. You can check the status in your orders page.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="block bg-neutral-900 py-3.5 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-neutral-800"
            >
              View Order Details
            </Link>
          )}
          <Link
            href="/orders"
            className="block border border-neutral-200 py-3 text-xs font-medium tracking-[0.2em] text-neutral-900 uppercase transition hover:bg-neutral-50"
          >
            View All Orders
          </Link>
          <Link
            href="/"
            className="block py-2 text-xs font-medium tracking-wider text-neutral-500 uppercase transition hover:text-neutral-900"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
