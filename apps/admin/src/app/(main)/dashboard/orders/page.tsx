'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { Order } from '@repo/types';
import { Button } from '@/components/ui/button';
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
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { DataTableFilters, type FilterConfig } from '@/components/DataTableFilters';
import { Eye, DollarSign, ShoppingCart, Clock, TrendingUp } from 'lucide-react';

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

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface OrderStats {
  totalOrders: number;
  revenue: number;
  avgOrderValue: number;
  byStatus: Record<string, number>;
}

const orderFilterConfigs: FilterConfig[] = [
  { key: 'search', label: 'Search', type: 'search', placeholder: 'Order # or customer name...' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'All Statuses',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'paid', label: 'Paid' },
      { value: 'processing', label: 'Processing' },
      { value: 'shipped', label: 'Shipped' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'returned', label: 'Returned' },
    ],
  },
  { key: 'date', label: 'Date Range', type: 'date-range', placeholder: 'Filter by date...' },
  { key: 'amount', label: 'Amount', type: 'number-range', prefix: '$' },
];

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const page = Number(searchParams.get('page')) || 1;

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Filter state
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    search: '',
    status: '',
    date: { from: undefined, to: undefined },
    amount: { min: undefined, max: undefined },
  });

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
      setError(err instanceof Error ? err.message : 'Failed to load orders');
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
      setError(err instanceof Error ? err.message : 'Failed to update status');
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <span className="text-sm text-muted-foreground">{total} total orders</span>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-blue-500/15 p-2">
                <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-xl font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-green-500/15 p-2">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(stats.revenue)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-yellow-500/15 p-2">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{stats.byStatus['pending'] || 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-purple-500/15 p-2">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <p className="text-xl font-bold">{formatCurrency(stats.avgOrderValue)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <span className="text-sm text-muted-foreground">{selectedOrders.size} selected</span>
          <Select onValueChange={handleBulkStatusUpdate}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Bulk action..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="processing">Mark Processing</SelectItem>
              <SelectItem value="shipped">Mark Shipped</SelectItem>
              <SelectItem value="delivered">Mark Delivered</SelectItem>
              <SelectItem value="cancelled">Cancel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive mb-4">{error}</div>
      )}

      {/* Orders table */}
      <div className="rounded-lg border bg-card">
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
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <div className="h-12 animate-pulse bg-muted rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              orders.map((order: Order) => {
                const orderId = (order as any)._id || order.orderNumber;
                return (
                  <TableRow key={orderId}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(orderId)}
                        onChange={() => toggleOrderSelection(orderId)}
                        className="size-4 rounded border-input"
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground font-mono">
                        {order.orderNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.shippingAddress
                        ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
                        : order.guestEmail || order.userId}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.items?.length || 0} items
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Select value={order.status} onValueChange={(v) => handleStatusChange(orderId, v)}>
                        <SelectTrigger className={`w-[155px] h-8 text-xs font-semibold ${statusColors[order.status] || ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                          <SelectItem value="refund_requested">Refund Requested</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <DataTableRowActions actions={[
                        { label: 'View', href: `/dashboard/orders/${orderId}`, icon: <Eye className="h-4 w-4" /> },
                      ]} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {!loading && orders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No orders found.
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
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/orders?page=${page + 1}`)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
