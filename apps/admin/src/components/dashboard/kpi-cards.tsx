'use client';

import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/analytics-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CARD_TONES, type CardTone } from '@/lib/chart-colors';

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
    labelKey: 'overview.kpi.totalRevenue',
    icon: DollarSign,
    tone: 'emerald' as CardTone,
    format: (v: number) => formatCurrency(v),
  },
  {
    key: 'totalOrders' as const,
    labelKey: 'overview.kpi.totalOrders',
    icon: ShoppingCart,
    tone: 'blue' as CardTone,
    format: (v: number) => v.toLocaleString('pl-PL'),
  },
  {
    key: 'avgOrderValue' as const,
    labelKey: 'overview.kpi.avgOrderValue',
    icon: TrendingUp,
    tone: 'violet' as CardTone,
    format: (v: number) => formatCurrency(v),
  },
  {
    key: 'customerCount' as const,
    labelKey: 'overview.kpi.totalCustomers',
    icon: Users,
    tone: 'amber' as CardTone,
    format: (v: number) => v.toLocaleString('pl-PL'),
  },
];

export function KpiCards({ revenue, totalOrders, avgOrderValue, customerCount, loading }: KpiCardsProps) {
  const { t } = useTranslation();
  const values = { revenue, totalOrders, avgOrderValue, customerCount };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const tone = CARD_TONES[card.tone];
        return (
        <Card key={card.key} className={cn('bg-linear-to-t to-card', tone.grad)}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardDescription>{t(card.labelKey)}</CardDescription>
            <CardTitle>
              <div className={cn('flex size-8 items-center justify-center rounded-lg', tone.iconBg, tone.iconText)}>
                <card.icon className="size-4" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="mt-1 h-8 w-28" />
            ) : (
              <div className="text-2xl font-semibold leading-none tracking-tight tabular-nums sm:text-3xl">
                {card.format(values[card.key])}
              </div>
            )}
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
