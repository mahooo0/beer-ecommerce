'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Label, Pie, PieChart } from 'recharts';
import { ShoppingCart, DollarSign, Clock, TrendingUp } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ORDER_STATUS_COLOR, CHART } from '@/lib/chart-colors';

export interface OrderStats {
  totalOrders: number;
  revenue: number;
  avgOrderValue: number;
  byStatus: Record<string, number>;
}

const zl = (cents: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(cents / 100);

// Distinct colour per status (shared with the customer detail + analytics donuts).
const STATUS_FILL = ORDER_STATUS_COLOR;

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-yellow-500',
  paid: 'bg-green-500',
  processing: 'bg-blue-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  returned: 'bg-orange-500',
  refund_requested: 'bg-pink-500',
};

export function OrderInsights({ stats }: { stats: OrderStats }) {
  const { t } = useTranslation();

  const dist = useMemo(
    () =>
      Object.entries(stats.byStatus)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({ status, count, fill: STATUS_FILL[status] || CHART.blue }))
        .sort((a, b) => b.count - a.count),
    [stats.byStatus],
  );

  const totalForDist = useMemo(() => dist.reduce((s, d) => s + d.count, 0), [dist]);

  const pieConfig: ChartConfig = {
    count: { label: t('orders.columns.order') },
    ...Object.fromEntries(
      dist.map((d) => [d.status, { label: t(`orders.status.${d.status}`), color: d.fill }]),
    ),
  };

  const kpis = [
    {
      key: 'totalOrders',
      label: t('orders.stats.totalOrders'),
      value: String(stats.totalOrders),
      icon: <ShoppingCart className="size-4" />,
    },
    {
      key: 'revenue',
      label: t('orders.stats.revenue'),
      value: zl(stats.revenue),
      icon: <DollarSign className="size-4" />,
    },
    {
      key: 'pending',
      label: t('orders.stats.pending'),
      value: String(stats.byStatus['pending'] || 0),
      icon: <Clock className="size-4" />,
    },
    {
      key: 'aov',
      label: t('orders.stats.avgOrderValue'),
      value: zl(stats.avgOrderValue),
      icon: <TrendingUp className="size-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* KPI cards (2×2) */}
      <div className="grid grid-cols-2 gap-4 lg:col-span-2">
        {kpis.map((k) => (
          <Card key={k.key} className="bg-linear-to-t from-primary/5 to-card">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">{k.label}</CardTitle>
              <span className="flex size-8 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                {k.icon}
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold leading-none tracking-tight tabular-nums">
                {k.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status breakdown donut + legend */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('orders.insights.statusBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          {dist.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
              {t('orders.empty')}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ChartContainer config={pieConfig} className="aspect-square h-[160px]">
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie data={dist} dataKey="count" nameKey="status" innerRadius={44} strokeWidth={4}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-xl font-bold">
                                {totalForDist}
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="min-w-0 flex-1 space-y-1.5">
                {dist.slice(0, 6).map((d) => (
                  <div key={d.status} className="flex items-center gap-2 text-sm">
                    <span className={cn('size-2 shrink-0 rounded-full', STATUS_DOT[d.status])} />
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {t(`orders.status.${d.status}`)}
                    </span>
                    <span className="font-medium tabular-nums">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
