'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { Order } from '@repo/types';

const statusTabs = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const statusBadgeColors: Record<string, string> = {
  pending: 'bg-utility-warning-50 text-utility-warning-700',
  paid: 'bg-utility-success-50 text-utility-success-700',
  processing: 'bg-utility-brand-50 text-utility-brand-700',
  shipped: 'bg-utility-purple-50 text-utility-purple-700',
  delivered: 'bg-utility-success-50 text-utility-success-700',
  cancelled: 'bg-utility-error-50 text-utility-error-700',
  returned: 'bg-utility-orange-50 text-utility-orange-700',
  refund_requested: 'bg-utility-pink-50 text-utility-pink-700',
};

export function OrdersListClient() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (status: string, pageNum: number) => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      if (!token || !user?.id) return;

      const res = await api.orders.getByUser(
        user.id,
        { page: pageNum, limit: 10, status: status || undefined },
        token,
      );

      if (res.success && res.data) {
        setOrders(res.data);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchOrders(activeTab, page);
    }
  }, [activeTab, page, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase">Your</p>
        <h1 className="mt-1 text-display-xs font-light text-neutral-900">Orders</h1>
      </div>

      {/* Status tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-neutral-200">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2.5 text-xs font-medium tracking-wider uppercase whitespace-nowrap transition border-b-2 ${
              activeTab === tab.value
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse bg-neutral-50 rounded" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-utility-error-50 border border-utility-error-200 rounded-lg p-4 text-utility-error-700">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="py-24 text-center">
          <svg className="mx-auto size-16 text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-neutral-500">No orders found</p>
          <Link
            href="/"
            className="mt-6 inline-block bg-neutral-900 px-8 py-3 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-neutral-800"
          >
            Start Shopping
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={(order as any)._id || order.id}
              href={`/orders/${(order as any)._id || order.id}`}
              className="block border border-neutral-200 p-5 transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-neutral-900">{order.orderNumber}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeColors[order.status] || 'bg-neutral-100 text-neutral-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-900">${(order.totalAmount / 100).toFixed(2)}</p>
                  <p className="text-xs text-neutral-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Item thumbnails */}
              <div className="mt-3 flex gap-2">
                {order.items.slice(0, 4).map((item, i) => (
                  <div key={i} className="size-12 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                    )}
                  </div>
                ))}
                {order.items.length > 4 && (
                  <div className="size-12 bg-neutral-100 rounded flex items-center justify-center text-xs text-neutral-400">
                    +{order.items.length - 4}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 text-xs font-medium tracking-wider text-neutral-500 uppercase border border-neutral-200 transition hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 text-xs font-medium tracking-wider text-neutral-500 uppercase border border-neutral-200 transition hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
