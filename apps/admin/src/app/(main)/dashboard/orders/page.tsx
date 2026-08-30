'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import type { Order } from '@repo/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { DataTableFilters, type FilterConfig } from '@/components/DataTableFilters';
import { Eye, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrdersBoard } from './_components/orders-board';
import { OrderInsights } from './_components/order-insights';
import { useCustomerMap } from './_components/use-customer-map';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  paid: 'bg-green-500/15 text-green-600 dark:text-green-400',
  processing: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  shipped: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  delivered: 'bg-green-500/15 text-green-600 dark:text-green-400',
  cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400',
  returned: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  refund_requested: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
};

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

// Fulfillment pipeline progress (%) per status — drives the row progress bar.
const FULFILL_PCT: Record<string, number> = {
  pending: 12,
  paid: 38,
  processing: 60,
  shipped: 82,
  delivered: 100,
  cancelled: 100,
  returned: 100,
  refund_requested: 100,
};
const BAD_STATUSES = new Set(['cancelled', 'returned', 'refund_requested']);

const paymentBadge: Record<string, string> = {
  succeeded: 'bg-green-500/15 text-green-600 dark:text-green-400',
  paid: 'bg-green-500/15 text-green-600 dark:text-green-400',
  pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
  refunded: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  partially_refunded: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(cents / 100);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString();
}

interface OrderStats {
  totalOrders: number;
  revenue: number;
  avgOrderValue: number;
  byStatus: Record<string, number>;
}

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const customerMap = useCustomerMap();
  const page = Number(searchParams.get('page')) || 1;

  const [view, setView] = useState<'list' | 'board'>(
    searchParams.get('view') === 'board' ? 'board' : 'list',
  );

  // Keep the view in sync with the URL so the sidebar "Board" link works and
  // the toggle is shareable/back-button friendly.
  useEffect(() => {
    setView(searchParams.get('view') === 'board' ? 'board' : 'list');
  }, [searchParams]);

  const changeView = (v: 'list' | 'board') => {
    setView(v);
    router.replace(v === 'board' ? '/dashboard/orders?view=board' : '/dashboard/orders');
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    search: '',
    status: '',
    date: { from: undefined, to: undefined },
    amount: { min: undefined, max: undefined },
  });

  const orderFilterConfigs: FilterConfig[] = [
    { key: 'search', label: t('orders.filters.search'), type: 'search', placeholder: t('orders.filters.searchPlaceholder') },
    {
      key: 'status',
      label: t('orders.filters.status'),
      type: 'select',
      placeholder: t('orders.filters.allStatuses'),
      options: ALL_STATUSES.filter((s) => s !== 'refund_requested').map((s) => ({ value: s, label: t(`orders.status.${s}`) })),
    },
    { key: 'date', label: t('orders.filters.dateRange'), type: 'date-range', placeholder: t('orders.filters.datePlaceholder') },
    { key: 'amount', label: t('orders.filters.amount'), type: 'number-range', prefix: 'zł' },
  ];

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleFilterReset = () => {
    setFilterValues({
      search: '',
      status: '',
      date: { from: undefined, to: undefined },
      amount: { min: undefined, max: undefined },
    });
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const dateRange = filterValues.date as { from?: string; to?: string };
      const amountRange = filterValues.amount as { min?: number; max?: number };
      const response = await api.orders.getAll({
        page,
        limit: 20,
        status: filterValues.status || undefined,
        search: filterValues.search || undefined,
        dateFrom: dateRange?.from || undefined,
        dateTo: dateRange?.to || undefined,
        minAmount: amountRange?.min || undefined,
        maxAmount: amountRange?.max || undefined,
        token: token || undefined,
      });
      setOrders(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orders.errors.load'));
    } finally {
      setLoading(false);
    }
  }, [page, filterValues]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await api.orders.getStats(token || undefined);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch {
      // Stats are non-critical
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const token = await getToken();
      await api.orders.updateStatus(orderId, newStatus, token || undefined);
      fetchOrders();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orders.errors.updateStatus'));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.size === 0) return;
    const token = await getToken();
    for (const orderId of selectedOrders) {
      try {
        await api.orders.updateStatus(orderId, newStatus, token || undefined);
      } catch {
        // Continue with remaining orders
      }
    }
    setSelectedOrders(new Set());
    fetchOrders();
    fetchStats();
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((o) => (o as any)._id || o.orderNumber)));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{t('orders.title')}</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{t('orders.totalCount', { count: total })}</span>
          {/* List / Board view toggle */}
          <div className="inline-flex items-center rounded-lg border bg-card p-0.5">
            <button
              type="button"
              onClick={() => changeView('list')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors',
                view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <List className="size-4" />
              {t('orders.view.list')}
            </button>
            <button
              type="button"
              onClick={() => changeView('board')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors',
                view === 'board' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid className="size-4" />
              {t('orders.view.board')}
            </button>
          </div>
        </div>
      </div>

      {/* Insights: KPI cards + status breakdown donut */}
      {stats && (
        <div className="mb-6">
          <OrderInsights stats={stats} />
        </div>
      )}

      {view === 'board' ? (
        <OrdersBoard />
      ) : (
        <>
          {/* Filter bar */}
          <div className="mb-4">
            <DataTableFilters
              filters={orderFilterConfigs}
              values={filterValues}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
            />
          </div>

          {/* Bulk actions */}
          {selectedOrders.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">
                {t('orders.bulk.selected', { count: selectedOrders.size })}
              </span>
              <Select onValueChange={handleBulkStatusUpdate}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('orders.bulk.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="processing">{t('orders.bulk.markProcessing')}</SelectItem>
                  <SelectItem value="shipped">{t('orders.bulk.markShipped')}</SelectItem>
                  <SelectItem value="delivered">{t('orders.bulk.markDelivered')}</SelectItem>
                  <SelectItem value="cancelled">{t('orders.bulk.cancel')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive mb-4">{error}</div>
          )}

          {/* Orders table */}
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={orders.length > 0 && selectedOrders.size === orders.length}
                      onChange={toggleAllOrders}
                      className="size-4 rounded border-input"
                    />
                  </TableHead>
                  <TableHead>{t('orders.columns.order')}</TableHead>
                  <TableHead>{t('orders.columns.customer')}</TableHead>
                  <TableHead className="text-center">{t('orders.columns.items')}</TableHead>
                  <TableHead>{t('orders.columns.total')}</TableHead>
                  <TableHead>{t('orders.columns.payment')}</TableHead>
                  <TableHead className="min-w-[180px]">{t('orders.columns.fulfillment')}</TableHead>
                  <TableHead className="text-right">{t('orders.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <div className="h-14 animate-pulse bg-muted rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  orders.map((order: Order) => {
                    const orderId = (order as any)._id || order.orderNumber;
                    const cust = order.userId ? customerMap.get(order.userId) : undefined;
                    const custName =
                      cust?.name ||
                      (order.shippingAddress
                        ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim()
                        : order.guestEmail || order.userId || '—');
                    const isGuest = !order.userId;
                    const custSub = isGuest ? t('orders.guest') : cust?.email || t('orders.registered');
                    const custAvatar = cust?.avatar || null;
                    const payStatus = (order as any).payment?.status as string | undefined;
                    const bad = BAD_STATUSES.has(order.status);
                    return (
                      <TableRow key={orderId} className="group">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(orderId)}
                            onChange={() => toggleOrderSelection(orderId)}
                            className="size-4 rounded border-input"
                          />
                        </TableCell>
                        {/* Order # + date */}
                        <TableCell>
                          <Link href={`/dashboard/orders/${orderId}`} className="block">
                            <span className="font-mono text-sm font-medium text-foreground group-hover:underline">
                              {order.orderNumber}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </span>
                          </Link>
                        </TableCell>
                        {/* Customer w/ Clerk avatar — links to the customer page */}
                        <TableCell>
                          {isGuest ? (
                            <div className="flex items-center gap-2.5">
                              <Avatar className="size-8 ring-1 ring-foreground/10">
                                {custAvatar ? <AvatarImage src={custAvatar} alt={custName} /> : null}
                                <AvatarFallback className="text-[11px] font-medium">
                                  {initials(custName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="max-w-[160px] truncate text-sm font-medium text-foreground">
                                  {custName}
                                </div>
                                <div className="max-w-[160px] truncate text-xs text-muted-foreground">
                                  {custSub}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Link
                              href={`/dashboard/customers/${order.userId}`}
                              className="group/cust flex items-center gap-2.5"
                            >
                              <Avatar className="size-8 ring-1 ring-foreground/10">
                                {custAvatar ? <AvatarImage src={custAvatar} alt={custName} /> : null}
                                <AvatarFallback className="text-[11px] font-medium">
                                  {initials(custName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="max-w-[160px] truncate text-sm font-medium text-foreground group-hover/cust:underline">
                                  {custName}
                                </div>
                                <div className="max-w-[160px] truncate text-xs text-muted-foreground">
                                  {custSub}
                                </div>
                              </div>
                            </Link>
                          )}
                        </TableCell>
                        {/* Items */}
                        <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
                          {order.items?.length || 0}
                        </TableCell>
                        {/* Total */}
                        <TableCell className="text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        {/* Payment */}
                        <TableCell>
                          {payStatus ? (
                            <Badge
                              variant="secondary"
                              className={cn('text-[11px]', paymentBadge[payStatus] || 'bg-muted text-muted-foreground')}
                            >
                              {t(`orders.payment.${payStatus}`, payStatus)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        {/* Fulfillment: status select + progress */}
                        <TableCell>
                          <div className="space-y-1.5">
                            <Select value={order.status} onValueChange={(v) => handleStatusChange(orderId, v)}>
                              <SelectTrigger className={cn('h-7 w-[150px] text-xs font-semibold', statusColors[order.status])}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s}>{t(`orders.status.${s}`)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Progress
                              value={FULFILL_PCT[order.status] ?? 0}
                              className={cn(
                                'h-1.5 bg-muted',
                                bad
                                  ? '*:data-[slot=progress-indicator]:bg-destructive'
                                  : '*:data-[slot=progress-indicator]:bg-emerald-500',
                              )}
                            />
                          </div>
                        </TableCell>
                        {/* Actions */}
                        <TableCell className="text-right">
                          <DataTableRowActions actions={[
                            { label: t('orders.actions.view'), href: `/dashboard/orders/${orderId}`, icon: <Eye className="h-4 w-4" /> },
                          ]} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
            {!loading && orders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {t('orders.empty')}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/orders?page=${page - 1}`)}
                disabled={page <= 1}
              >
                {t('orders.pagination.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('orders.pagination.page', { page, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/orders?page=${page + 1}`)}
                disabled={page >= totalPages}
              >
                {t('orders.pagination.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
