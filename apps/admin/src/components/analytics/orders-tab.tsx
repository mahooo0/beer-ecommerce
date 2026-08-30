'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Label,
  Pie,
  PieChart,
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
  LabelList,
} from 'recharts';
import { ShoppingCart, CheckCircle2, XCircle, Receipt } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Order } from '@repo/types';
import { groupOrdersByPeriod } from '@/lib/analytics-utils';
import { CHART, ORDER_STATUS_COLOR } from '@/lib/chart-colors';
import { StatCard } from './stat-card';

interface OrdersTabProps {
  orders: Order[];
  orderStats: { totalOrders: number; revenue: number; avgOrderValue: number; byStatus: Record<string, number> } | null;
}

const zl = (cents: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(cents / 100);

const STATUS_ORDER = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refund_requested'];

export function OrdersTab({ orders, orderStats }: OrdersTabProps) {
  const { t } = useTranslation();
  // Reuse the shared order-status labels so the analytics charts match the rest of the admin.
  const statusLabel = (s: string) => t(`orders.status.${s}`);

  const statusDist = useMemo(() => {
    if (!orderStats) return [];
    return STATUS_ORDER.map((status) => ({
      status,
      count: orderStats.byStatus[status] || 0,
      fill: ORDER_STATUS_COLOR[status] || CHART.blue,
    })).filter((s) => s.count > 0);
  }, [orderStats]);

  const timeseries = useMemo(
    () => groupOrdersByPeriod(orders, 'daily').map((d) => ({ ...d, revenueZl: d.revenue / 100 })),
    [orders],
  );

  const pieConfig: ChartConfig = {
    count: { label: t('analyticsKpi.orders') },
    ...Object.fromEntries(statusDist.map((d) => [d.status, { label: statusLabel(d.status), color: d.fill }])),
  };
  const areaConfig: ChartConfig = {
    orderCount: { label: t('analyticsKpi.orders'), color: CHART.blue },
    revenueZl: { label: t('analyticsKpi.revenue'), color: CHART.emerald },
  };
  const barConfig: ChartConfig = { count: { label: t('analyticsKpi.orders'), color: CHART.violet } };

  const total = orderStats?.totalOrders || 0;
  const delivered = orderStats?.byStatus['delivered'] || 0;
  const cancelled = orderStats?.byStatus['cancelled'] || 0;
  const fulfillmentRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0';
  const cancellationRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard tone="blue" label={t('analytics.ordersTab.totalOrders')} value={String(total)} icon={<ShoppingCart className="size-4" />} />
        <StatCard tone="emerald" label={t('analytics.ordersTab.fulfillment')} value={`${fulfillmentRate}%`} icon={<CheckCircle2 className="size-4" />} sub={t('analytics.ordersTab.fulfillmentSub')} />
        <StatCard tone="rose" label={t('analytics.ordersTab.cancellation')} value={`${cancellationRate}%`} icon={<XCircle className="size-4" />} sub={t('analytics.ordersTab.cancellationSub')} />
        <StatCard tone="amber" label={t('analytics.ordersTab.aov')} value={zl(orderStats?.avgOrderValue || 0)} icon={<Receipt className="size-4" />} />
      </div>

      {/* Orders & revenue over time */}
      <Card>
        <CardHeader><CardTitle>{t('analytics.ordersTab.overTime')}</CardTitle></CardHeader>
        <CardContent>
          {timeseries.length === 0 ? (
            <Empty />
          ) : (
            <ChartContainer config={areaConfig} className="h-[300px] w-full">
              <AreaChart data={timeseries} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.blue} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART.blue} stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="fillRevZl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.emerald} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART.emerald} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis yAxisId="orders" tickLine={false} axisLine={false} width={32} />
                <YAxis yAxisId="rev" orientation="right" tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `${v} zł`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area yAxisId="rev" dataKey="revenueZl" type="monotone" stroke={CHART.emerald} strokeWidth={2} fill="url(#fillRevZl)" />
                <Area yAxisId="orders" dataKey="orderCount" type="monotone" stroke={CHART.blue} strokeWidth={2} fill="url(#fillOrders)" />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status donut */}
        <Card>
          <CardHeader><CardTitle>{t('analytics.ordersTab.statusDistribution')}</CardTitle></CardHeader>
          <CardContent>
            {statusDist.length === 0 ? (
              <Empty />
            ) : (
              <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[280px]">
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie data={statusDist} dataKey="count" nameKey="status" innerRadius={70} strokeWidth={5}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">{total}</tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">{t('analytics.ordersTab.ordersCenter')}</tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Ranked status bars */}
        <Card>
          <CardHeader><CardTitle>{t('analytics.ordersTab.byStatus')}</CardTitle></CardHeader>
          <CardContent>
            {statusDist.length === 0 ? (
              <Empty />
            ) : (
              <ChartContainer config={barConfig} className="h-[280px] w-full">
                <BarChart data={statusDist.map((s) => ({ label: statusLabel(s.status), count: s.count, fill: s.fill }))} layout="vertical" margin={{ left: 8, right: 32 }}>
                  <XAxis type="number" dataKey="count" hide />
                  <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={110} tickMargin={4} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="count" radius={6} barSize={22}>
                    <LabelList dataKey="count" position="right" className="fill-foreground text-xs" />
                    {statusDist.map((s) => (
                      <Cell key={s.status} fill={s.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Empty() {
  const { t } = useTranslation();
  return <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">{t('analytics.emptyShort')}</div>;
}
