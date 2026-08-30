'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import type { Order } from '@repo/types';
import TrackingSection from './tracking-section';

export default function OrderDetailPage() {
  const { t } = useTranslation('profile');
  const params = useParams();
  const orderId = params.id as string;

  const statusLabel = (s: string) =>
    t(`ordersDetail.status.${s}`, { defaultValue: s });

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.orders.getById(orderId);
        if (response.success && response.data) {
          setOrder(response.data);
        } else {
          setError(t('ordersDetail.loadError'));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('ordersDetail.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (cents: number) => {
    return `${((cents ?? 0) / 100).toFixed(2)} zł`;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-utility-warning-50 text-utility-warning-700',
      PAID: 'bg-utility-success-50 text-utility-success-700',
      PROCESSING: 'bg-utility-brand-50 text-utility-brand-700',
      SHIPPED: 'bg-utility-purple-50 text-utility-purple-700',
      DELIVERED: 'bg-utility-success-50 text-utility-success-700',
      CANCELLED: 'bg-utility-error-50 text-utility-error-700',
      RETURNED: 'bg-utility-orange-50 text-utility-orange-700',
      REFUND_REQUESTED: 'bg-utility-pink-50 text-utility-pink-700',
    };
    return colors[status] || 'bg-secondary_subtle text-primary';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-secondary_subtle rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-secondary_subtle rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-utility-error-50 border border-utility-error-200 rounded-lg p-4 text-utility-error-700 mb-4">
          {error || t('ordersDetail.notFound')}
        </div>
        <Link href="/orders" className="text-brand-secondary hover:underline">
          &larr; {t('ordersDetail.backToOrders')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/orders" className="text-brand-secondary hover:underline">
          &larr; {t('ordersDetail.backToOrders')}
        </Link>
      </div>

      <div className="bg-primary rounded-lg shadow-sm border border-border-secondary p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{t('ordersDetail.orderTitle', { number: order.orderNumber })}</h1>
            <p className="text-tertiary">{formatDate(order.createdAt)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
            {statusLabel(order.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-primary rounded-lg shadow-sm border border-border-secondary p-6">
          <h2 className="text-lg font-semibold mb-4">{t('ordersDetail.shippingAddress')}</h2>
          <div className="text-secondary">
            <p className="font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
            <p>{order.shippingAddress.country}</p>
            {order.shippingAddress.phone && <p className="mt-2">{t('ordersDetail.phoneLabel')} {order.shippingAddress.phone}</p>}
          </div>
        </div>

        <TrackingSection order={order} />
      </div>

      <div className="bg-primary rounded-lg shadow-sm border border-border-secondary p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('ordersDetail.orderItems')}</h2>
        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-start pb-4 border-b border-border-secondary last:border-b-0">
              <div className="flex items-start gap-4">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-tertiary">{t('ordersDetail.skuLabel', { sku: item.sku })}</p>
                  {item.attributes && Object.keys(item.attributes).length > 0 && (
                    <p className="text-sm text-tertiary">
                      {Object.entries(item.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-tertiary">{t('ordersDetail.quantityLabel', { quantity: item.quantity })}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                <p className="text-sm text-tertiary">{formatCurrency(item.price)} {t('ordersDetail.each')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary rounded-lg shadow-sm border border-border-secondary p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('ordersDetail.orderSummary')}</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-secondary">
            <span>{t('ordersDetail.subtotal')}</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-secondary">
            <span>{t('ordersDetail.shipping')}</span>
            <span>{formatCurrency(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between text-secondary">
            <span>{t('ordersDetail.tax')}</span>
            <span>{formatCurrency(order.taxAmount)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-utility-success-700">
              <span>{t('ordersDetail.discount')} {order.couponCode && `(${order.couponCode})`}</span>
              <span>-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t border-border-secondary pt-2 mt-2">
            <span>{t('ordersDetail.total')}</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="bg-primary rounded-lg shadow-sm border border-border-secondary p-6">
          <h2 className="text-lg font-semibold mb-4">{t('ordersDetail.orderHistory')}</h2>
          <div className="space-y-3">
            {order.statusHistory.map((history, index) => (
              <div key={index} className="flex items-start gap-4 pb-3 border-b border-border-secondary last:border-b-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(history.to)}`}>
                      {statusLabel(history.to)}
                    </span>
                    {history.from && (
                      <>
                        <span className="text-quaternary">{t('ordersDetail.from')}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(history.from)}`}>
                          {statusLabel(history.from)}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-tertiary mt-1">{formatDate(history.changedAt)}</p>
                  {history.note && <p className="text-sm text-secondary mt-1">{history.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
