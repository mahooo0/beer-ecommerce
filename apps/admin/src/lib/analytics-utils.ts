import type { Order, OrderItem } from '@repo/types';

export type Period = 'daily' | 'weekly' | 'monthly';

export interface TimeSeriesPoint {
  label: string;
  revenue: number;
  orderCount: number;
}

export interface StatusDistributionItem {
  status: string;
  count: number;
  fill: string;
}

export interface TopProduct {
  productId: string;
  name: string;
  revenue: number;
  quantity: number;
}

const statusColorMap: Record<string, string> = {
  pending: 'var(--chart-1)',
  paid: 'var(--chart-2)',
  processing: 'var(--chart-3)',
  shipped: 'var(--chart-4)',
  delivered: 'var(--chart-5)',
  cancelled: 'var(--chart-1)',
  returned: 'var(--chart-2)',
  refund_requested: 'var(--chart-3)',
};

export function groupOrdersByPeriod(orders: Order[], period: Period): TimeSeriesPoint[] {
  const grouped = new Map<string, { revenue: number; orderCount: number }>();

  for (const order of orders) {
    const date = new Date(order.createdAt);
    let label: string;

    if (period === 'daily') {
      label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }

    const existing = grouped.get(label) || { revenue: 0, orderCount: 0 };
    existing.revenue += order.totalAmount;
    existing.orderCount += 1;
    grouped.set(label, existing);
  }

  return Array.from(grouped.entries()).map(([label, data]) => ({
    label,
    revenue: data.revenue,
    orderCount: data.orderCount,
  }));
}

export function computeStatusDistribution(byStatus: Record<string, number>): StatusDistributionItem[] {
  return Object.entries(byStatus).map(([status, count]) => ({
    status,
    count,
    fill: statusColorMap[status] || 'var(--chart-1)',
  }));
}

export function computeTopProducts(orders: Order[], limit = 5): TopProduct[] {
  const productMap = new Map<string, TopProduct>();

  for (const order of orders) {
    if (!order.items) continue;
    for (const item of order.items) {
      const existing = productMap.get(item.productId) || {
        productId: item.productId,
        name: item.name,
        revenue: 0,
        quantity: 0,
      };
      existing.revenue += item.price * item.quantity;
      existing.quantity += item.quantity;
      productMap.set(item.productId, existing);
    }
  }

  return Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return { from: fmt(from), to: fmt(to) };
}
