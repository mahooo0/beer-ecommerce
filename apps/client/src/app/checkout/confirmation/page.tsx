'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCartStore } from '@/stores/cart-store';
import { useCheckoutStore } from '@/stores/checkout-store';
import type { Order } from '@repo/types';

export default function ConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationContent />
    </Suspense>
  );
}

function ConfirmationContent() {
  const { t } = useTranslation('checkout');
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

        <h1 className="mt-6 text-display-xs font-light text-neutral-900">{t('confirmation.title')}</h1>
        <p className="mt-3 text-neutral-500">
          {t('confirmation.subtitle')}
        </p>

        {loading && (
          <div className="mt-6 animate-pulse">
            <div className="h-4 bg-neutral-100 rounded w-48 mx-auto" />
          </div>
        )}

        {order && (
          <div className="mt-6 bg-neutral-50 border border-neutral-200 p-6 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-500">{t('confirmation.orderNumber')}</span>
              <span className="font-mono font-medium text-neutral-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">{t('confirmation.status')}</span>
              <span className="font-medium text-neutral-900 capitalize">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">{t('confirmation.total')}</span>
              <span className="font-medium text-neutral-900">${(order.totalAmount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">{t('confirmation.items')}</span>
              <span className="text-neutral-900">{order.items.length}</span>
            </div>
          </div>
        )}

        {!loading && !order && orderId && (
          <p className="mt-4 text-sm text-neutral-400">
            {t('confirmation.processing')}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="block bg-neutral-900 py-3.5 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-neutral-800"
            >
              {t('confirmation.viewOrderDetails')}
            </Link>
          )}
          <Link
            href="/orders"
            className="block border border-neutral-200 py-3 text-xs font-medium tracking-[0.2em] text-neutral-900 uppercase transition hover:bg-neutral-50"
          >
            {t('confirmation.viewAllOrders')}
          </Link>
          <Link
            href="/"
            className="block py-2 text-xs font-medium tracking-wider text-neutral-500 uppercase transition hover:text-neutral-900"
          >
            {t('confirmation.continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  );
}
