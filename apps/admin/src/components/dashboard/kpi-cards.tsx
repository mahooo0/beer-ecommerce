'use client';

import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/analytics-utils';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiCardsProps {
  revenue: number;
  totalOrders: number;
  avgOrderValue: number;
  customerCount: number;
  loading: boolean;
}

const cards = [
  {
    key: 'revenue' as const,
    label: 'Total Revenue',
    icon: DollarSign,
    color: 'bg-green-50 text-green-600',
    format: (v: number) => formatCurrency(v),
  },
  {
    key: 'totalOrders' as const,
    label: 'Total Orders',
    icon: ShoppingCart,
    color: 'bg-blue-50 text-blue-600',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'avgOrderValue' as const,
    label: 'Avg Order Value',
    icon: TrendingUp,
    color: 'bg-purple-50 text-purple-600',
    format: (v: number) => formatCurrency(v),
  },
  {
    key: 'customerCount' as const,
    label: 'Total Customers',
    icon: Users,
    color: 'bg-indigo-50 text-indigo-600',
    format: (v: number) => v.toLocaleString(),
  },
];

export function KpiCards({ revenue, totalOrders, avgOrderValue, customerCount, loading }: KpiCardsProps) {
  const values = { revenue, totalOrders, avgOrderValue, customerCount };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.key} className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-md p-2 ${card.color}`}>
              <card.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              {loading ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <p className="text-xl font-bold">{card.format(values[card.key])}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
