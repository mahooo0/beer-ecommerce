'use client';

import Link from 'next/link';
import type { Order } from '@repo/types';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/analytics-utils';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-orange-100 text-orange-800',
  refund_requested: 'bg-pink-100 text-pink-800',
};

interface RecentOrdersTableProps {
  orders: Order[];
  loading: boolean;
}

export function RecentOrdersTable({ orders, loading }: RecentOrdersTableProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-medium mb-4">Recent Orders</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            : orders.map((order) => {
                const orderId = (order as any)._id || order.orderNumber;
                const customerName = order.shippingAddress
                  ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
                  : order.guestEmail || order.userId;

                return (
                  <TableRow key={orderId} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${orderId}`}
                        className="font-mono text-sm font-medium hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{customerName}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusColors[order.status] || 'bg-muted text-foreground'}`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
      {!loading && orders.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No recent orders</div>
      )}
    </div>
  );
}
