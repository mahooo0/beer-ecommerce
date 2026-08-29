'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import type { Order } from '@repo/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  RefreshCw,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  User,
  XCircle,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ALL_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
  'refund_requested',
] as const;

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  paid: 'bg-green-500/15 text-green-600 dark:text-green-400',
  processing: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  shipped: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  delivered: 'bg-green-500/15 text-green-600 dark:text-green-400',
  cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400',
  returned: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  refund_requested: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
};

const paymentBadge: Record<string, string> = {
  succeeded: 'bg-green-500/15 text-green-600 dark:text-green-400',
  pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
  refunded: 'bg-red-500/15 text-red-600 dark:text-red-400',
  partially_refunded: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
};

function zl(cents: number) {
  return `${((cents || 0) / 100).toFixed(2)} zł`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PROGRESSION = ['pending', 'paid', 'processing', 'shipped', 'delivered'] as const;
const TERMINAL = ['cancelled', 'returned', 'refund_requested'] as const;

const stepIcon: Record<string, typeof Package> = {
  pending: ShoppingBag,
  paid: CreditCard,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
};

interface TimelineStep {
  status: string;
  at?: string | Date;
  state: 'done' | 'current' | 'upcoming' | 'terminal';
}

/** Ubold-style order tracker derived from status + statusHistory. */
function buildTimeline(order: Order): TimelineStep[] {
  const history = (order.statusHistory as { to: string; changedAt: string | Date }[] | undefined) ?? [];
  const payment = (order as any).payment;
  const shipping = (order as any).shipping;
  const atFor = (status: string): string | Date | undefined => {
    const h = [...history].reverse().find((x) => x.to === status);
    if (h?.changedAt) return h.changedAt;
    if (status === 'pending') return order.createdAt;
    if (status === 'paid') return payment?.paidAt;
    if (status === 'shipped') return shipping?.shippedAt;
    if (status === 'delivered') return shipping?.deliveredAt;
    return undefined;
  };

  const reached = new Set<string>(['pending', order.status]);
  history.forEach((h) => reached.add(h.to));
  const currentIdx = (PROGRESSION as readonly string[]).indexOf(order.status);

  const steps: TimelineStep[] = PROGRESSION.map((status, i) => {
    const done = reached.has(status) || (currentIdx >= 0 && i < currentIdx);
    const state: TimelineStep['state'] =
      currentIdx >= 0 && i === currentIdx ? 'current' : done ? 'done' : 'upcoming';
    return { status, at: atFor(status), state };
  });

  if ((TERMINAL as readonly string[]).includes(order.status)) {
    steps.push({ status: order.status, at: atFor(order.status), state: 'terminal' });
  }
  return steps;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { t } = useTranslation();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [refundAmount, setRefundAmount] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [trackingData, setTrackingData] = useState({ carrier: '', trackingNumber: '', estimatedDelivery: '' });
  const [trackingSubmitting, setTrackingSubmitting] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const response = await api.orders.getById(id, token || undefined);
      if (response.success && response.data) setOrder(response.data);
      else setError(t('orderDetail.notFound'));
    } catch (err: any) {
      setError(err.message || t('orderDetail.notFound'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    try {
      setStatusUpdating(true);
      const token = await getToken();
      await api.orders.updateStatus(id, newStatus, token || undefined);
      await fetchOrder();
    } catch (err: any) {
      setError(err.message || t('orders.errors.updateStatus'));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingData.carrier || !trackingData.trackingNumber) return;
    try {
      setTrackingSubmitting(true);
      const token = await getToken();
      await api.orders.addTracking(
        id,
        {
          carrier: trackingData.carrier,
          trackingNumber: trackingData.trackingNumber,
          estimatedDelivery: trackingData.estimatedDelivery || undefined,
        },
        token || undefined,
      );
      setTrackingData({ carrier: '', trackingNumber: '', estimatedDelivery: '' });
      setShowTrackingForm(false);
      await fetchOrder();
    } catch (err: any) {
      setError(err.message || 'Failed to add tracking');
    } finally {
      setTrackingSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    try {
      setRefundSubmitting(true);
      const token = await getToken();
      const amountCents = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined;
      await api.orders.refund(id, amountCents, token || undefined);
      setRefundAmount('');
      setRefundDialogOpen(false);
      await fetchOrder();
    } catch (err: any) {
      setError(err.message || 'Failed to process refund');
    } finally {
      setRefundSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        {t('orderDetail.loading')}
      </div>
    );
  }

  if (error && !order) {
    return (
      <div>
        <Button variant="ghost" onClick={() => router.push('/dashboard/orders')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('orderDetail.back')}
        </Button>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">{error}</div>
      </div>
    );
  }

  if (!order) return null;

  const shippingAddr = order.shippingAddress;
  const billingAddr = (order as any).billingAddress;
  const shipping = (order as any).shipping;
  const payment = (order as any).payment;
  const timeline = buildTimeline(order);
  const itemCount = order.items?.reduce((n, it: any) => n + (it.quantity || 0), 0) ?? 0;
  const canRefund = payment && (payment.status === 'succeeded' || payment.status === 'partially_refunded');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-bold text-2xl leading-tight">
              {t('orderDetail.orderNo', { number: order.orderNumber })}
            </h1>
            <p className="text-muted-foreground text-sm">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn('capitalize', statusBadge[order.status])}>{t(`orders.status.${order.status}`)}</Badge>
          {payment && (
            <Badge className={cn('capitalize', paymentBadge[payment.status] ?? 'bg-muted text-foreground')}>
              {payment.status}
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* LEFT */}
        <div className="space-y-6 xl:col-span-2">
          {/* Products */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-semibold text-lg">{t('orderDetail.itemsTitle')}</h2>
              <span className="text-muted-foreground text-sm">
                {t('orders.itemsCount', { count: itemCount })}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">{t('orderDetail.col.product')}</th>
                    <th className="px-6 py-3 text-right font-medium">{t('orderDetail.col.price')}</th>
                    <th className="px-6 py-3 text-center font-medium">{t('orderDetail.col.qty')}</th>
                    <th className="px-6 py-3 text-right font-medium">{t('orderDetail.col.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, index: number) => {
                    const unit = item.price ?? item.unitPrice ?? 0;
                    return (
                      <tr key={index} className="border-b last:border-0">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name || ''}
                                  width={48}
                                  height={48}
                                  className="size-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <Package className="size-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {item.name || item.productName || item.productId}
                              </p>
                              {(item.sku || item.variantName || item.attributes) && (
                                <p className="truncate text-muted-foreground text-xs">
                                  {item.sku ? `SKU: ${item.sku}` : ''}
                                  {item.variantName ? ` · ${item.variantName}` : ''}
                                  {!item.variantName && item.attributes
                                    ? ` · ${Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}`
                                    : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground tabular-nums">{zl(unit)}</td>
                        <td className="px-6 py-4 text-center tabular-nums">{item.quantity}</td>
                        <td className="px-6 py-4 text-right font-medium tabular-nums">{zl(unit * item.quantity)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Totals */}
            <div className="border-t px-6 py-4">
              <div className="ml-auto max-w-xs space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('orderDetail.summary.subtotal')}</span>
                  <span className="tabular-nums">{zl((order as any).subtotal ?? 0)}</span>
                </div>
                {(order as any).discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('orderDetail.summary.discount')}</span>
                    <span className="tabular-nums text-green-600 dark:text-green-400">
                      -{zl((order as any).discountAmount)}
                    </span>
                  </div>
                )}
                {(order as any).shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('orderDetail.summary.shipping')}</span>
                    <span className="tabular-nums">{zl((order as any).shippingCost)}</span>
                  </div>
                )}
                {(order as any).taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('orderDetail.summary.tax')}</span>
                    <span className="tabular-nums">{zl((order as any).taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-semibold text-base">
                  <span>{t('orderDetail.summary.total')}</span>
                  <span className="tabular-nums">{zl(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-5 font-semibold text-lg">{t('orderDetail.timelineTitle')}</h2>
            <ol className="relative space-y-6">
              {timeline.map((step, i) => {
                const Icon = step.state === 'terminal' ? XCircle : stepIcon[step.status] ?? Clock;
                const isLast = i === timeline.length - 1;
                const tone =
                  step.state === 'terminal'
                    ? 'bg-red-500 text-white'
                    : step.state === 'done'
                      ? 'bg-green-500 text-white'
                      : step.state === 'current'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground';
                return (
                  <li key={`${step.status}-${i}`} className="relative flex gap-4">
                    {!isLast && (
                      <span
                        className={cn(
                          'absolute top-9 left-4 h-[calc(100%-4px)] w-px -translate-x-1/2',
                          step.state === 'done' ? 'bg-green-500/40' : 'bg-border',
                        )}
                      />
                    )}
                    <span className={cn('z-10 flex size-8 shrink-0 items-center justify-center rounded-full', tone)}>
                      <Icon className="size-4" />
                    </span>
                    <div className="pt-1">
                      <p
                        className={cn(
                          'font-medium text-sm',
                          step.state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
                        )}
                      >
                        {t(`orderDetail.steps.${step.status}`)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {step.at ? formatDate(step.at) : t('orderDetail.steps.pendingLabel')}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Tracking */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-lg">{t('orderDetail.tracking.title')}</h2>
              <Button size="sm" variant="outline" onClick={() => setShowTrackingForm((v) => !v)}>
                {showTrackingForm ? t('orderDetail.tracking.cancel') : t('orderDetail.tracking.add')}
              </Button>
            </div>

            {showTrackingForm && (
              <form onSubmit={handleAddTracking} className="mb-4 space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-muted-foreground text-xs">{t('orderDetail.tracking.carrier')} *</label>
                    <Select value={trackingData.carrier} onValueChange={(v) => setTrackingData((d) => ({ ...d, carrier: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('orderDetail.tracking.carrier')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="InPost">InPost</SelectItem>
                        <SelectItem value="DPD">DPD</SelectItem>
                        <SelectItem value="DHL">DHL</SelectItem>
                        <SelectItem value="Poczta Polska">Poczta Polska</SelectItem>
                        <SelectItem value="Nova Poshta">Nova Poshta</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs">{t('orderDetail.tracking.number')} *</label>
                    <Input
                      value={trackingData.trackingNumber}
                      onChange={(e) => setTrackingData((d) => ({ ...d, trackingNumber: e.target.value }))}
                      placeholder="…"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs">{t('orderDetail.tracking.estDelivery')}</label>
                    <Input
                      type="date"
                      value={trackingData.estimatedDelivery}
                      onChange={(e) => setTrackingData((d) => ({ ...d, estimatedDelivery: e.target.value }))}
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" disabled={trackingSubmitting || !trackingData.carrier || !trackingData.trackingNumber}>
                  {trackingSubmitting ? t('orderDetail.tracking.adding') : t('orderDetail.tracking.markShipped')}
                </Button>
              </form>
            )}

            {shipping?.trackingNumber ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">{t('orderDetail.tracking.carrier')}:</span> {shipping.carrier}
                </p>
                <p>
                  <span className="font-medium text-foreground">{t('orderDetail.tracking.number')}:</span>{' '}
                  <span className="rounded bg-muted px-2 py-0.5 font-mono">{shipping.trackingNumber}</span>
                </p>
                {shipping.estimatedDelivery && (
                  <p>
                    <span className="font-medium text-foreground">{t('orderDetail.tracking.estDelivery')}:</span>{' '}
                    {formatDate(shipping.estimatedDelivery)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t('orderDetail.tracking.none')}</p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Summary + status */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 font-semibold text-lg">{t('orderDetail.summaryCard.title')}</h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('orderDetail.summaryCard.orderId')}</dt>
                <dd className="font-mono">{order.orderNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('orderDetail.summaryCard.date')}</dt>
                <dd>{formatDate(order.createdAt)}</dd>
              </div>
              {payment?.provider && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('orderDetail.summaryCard.paymentMethod')}</dt>
                  <dd className="capitalize">{payment.provider}</dd>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-2.5 font-semibold text-base">
                <dt>{t('orderDetail.summary.total')}</dt>
                <dd className="tabular-nums">{zl(order.totalAmount)}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <label className="mb-1.5 block text-muted-foreground text-xs">{t('orderDetail.statusTitle')}</label>
              <Select value={order.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`orders.status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-lg">
              <User className="size-4 text-muted-foreground" /> {t('orderDetail.customer.title')}
            </h2>
            <div className="space-y-1 text-muted-foreground text-sm">
              {shippingAddr && (
                <p className="font-medium text-foreground">
                  {shippingAddr.firstName} {shippingAddr.lastName}
                </p>
              )}
              {order.guestEmail && <p>{order.guestEmail}</p>}
              {order.userId ? (
                <p className="break-all text-xs">{order.userId}</p>
              ) : (
                <p className="text-xs">{t('orderDetail.customer.guest')}</p>
              )}
              {shippingAddr?.phone && <p>{shippingAddr.phone}</p>}
            </div>
          </div>

          {/* Shipping Address */}
          {shippingAddr && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-lg">
                <MapPin className="size-4 text-muted-foreground" /> {t('orderDetail.shippingAddress')}
              </h2>
              <div className="space-y-1 text-muted-foreground text-sm">
                <p className="font-medium text-foreground">
                  {shippingAddr.firstName} {shippingAddr.lastName}
                </p>
                <p>{shippingAddr.street || (shippingAddr as any).address1}</p>
                <p>
                  {[shippingAddr.city, shippingAddr.state, shippingAddr.zipCode].filter(Boolean).join(', ')}
                </p>
                <p>{shippingAddr.country}</p>
              </div>
            </div>
          )}

          {/* Billing Address */}
          {billingAddr && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-lg">
                <MapPin className="size-4 text-muted-foreground" /> {t('orderDetail.billingAddress')}
              </h2>
              <div className="space-y-1 text-muted-foreground text-sm">
                <p className="font-medium text-foreground">
                  {billingAddr.firstName} {billingAddr.lastName}
                </p>
                <p>{billingAddr.street || billingAddr.address1}</p>
                <p>{[billingAddr.city, billingAddr.state, billingAddr.zipCode].filter(Boolean).join(', ')}</p>
                <p>{billingAddr.country}</p>
              </div>
            </div>
          )}

          {/* Payment */}
          {payment && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-lg">
                <CreditCard className="size-4 text-muted-foreground" /> {t('orderDetail.payment.title')}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('orderDetail.payment.status')}</span>
                  <Badge className={cn('capitalize', paymentBadge[payment.status] ?? 'bg-muted text-foreground')}>
                    {payment.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('orderDetail.payment.amount')}</span>
                  <span className="tabular-nums">{zl(payment.amount)}</span>
                </div>
                {payment.refundedAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('orderDetail.payment.refunded')}</span>
                    <span className="tabular-nums text-red-600 dark:text-red-400">{zl(payment.refundedAmount)}</span>
                  </div>
                )}
                {payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('orderDetail.payment.paidAt')}</span>
                    <span>{formatDate(payment.paidAt)}</span>
                  </div>
                )}
              </div>

              {canRefund && (
                <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-4 w-full text-destructive">
                      <RefreshCw className="mr-2 h-4 w-4" /> {t('orderDetail.payment.issueRefund')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('orderDetail.payment.refundTitle')}</DialogTitle>
                      <DialogDescription>
                        {t('orderDetail.payment.refundDesc', { number: order.orderNumber })}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                      <label className="text-muted-foreground text-sm">{t('orderDetail.payment.refundAmount')}</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={(payment.amount - payment.refundedAmount) / 100}
                        placeholder={t('orderDetail.payment.fullRefund', {
                          amount: ((payment.amount - payment.refundedAmount) / 100).toFixed(2),
                        })}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">{t('orderDetail.payment.cancel')}</Button>
                      </DialogClose>
                      <Button variant="destructive" onClick={handleRefund} disabled={refundSubmitting}>
                        {refundSubmitting ? t('orderDetail.payment.processing') : t('orderDetail.payment.confirm')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
