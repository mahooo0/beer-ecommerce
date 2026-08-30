'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { Wallet, Receipt, ShoppingCart, BadgePercent } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Order } from '@repo/types';
import { groupOrdersByPeriod, computeTopProducts, type Period } from '@/lib/analytics-utils';
import { CHART, ORDER_STATUS_COLOR } from '@/lib/chart-colors';
import { StatCard } from './stat-card';

const zl = (cents: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(cents / 100);
const zlShort = (cents: number) => `${Math.round(cents / 100)} zł`;

const PAID = ['paid', 'processing', 'shipped', 'delivered'];

export function FinancialTab({ orders }: { orders: Order[] }) {
  const { t } = useTranslation();
  const [granularity, setGranularity] = useState<Period>('daily');

  const kpis = useMemo(() => {
    const paid = orders.filter((o) => PAID.includes(o.status));
    const revenue = paid.reduce((s, o) => s + o.totalAmount, 0);
    const aov = paid.length ? Math.round(revenue / paid.length) : 0;
    const discounts = orders.reduce((s, o) => s + ((o as any).discountAmount || 0), 0);
    return { revenue, aov, discounts, orderCount: orders.length, paidCount: paid.length };
  }, [orders]);

  const series = useMemo(
    () => groupOrdersByPeriod(orders, granularity).map((d) => ({ ...d, revenueZl: d.revenue / 100 })),
    [orders, granularity],
  );

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of orders) m.set(o.status, (m.get(o.status) || 0) + o.totalAmount);
    return Array.from(m.entries())
      .filter(([, v]) => v > 0)
      .map(([status, revenue]) => ({ status, revenue, fill: ORDER_STATUS_COLOR[status] || CHART.blue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const topProducts = useMemo(
    () => computeTopProducts(orders, 7).map((p) => ({ name: p.name, revenue: Math.round(p.revenue / 100) })),
    [orders],
  );

  const areaConfig: ChartConfig = { revenueZl: { label: t('analyticsKpi.revenue'), color: CHART.blue } };
  const barConfig: ChartConfig = { revenue: { label: t('analyticsKpi.revenue'), color: CHART.emerald } };
  const pieConfig: ChartConfig = {
    revenue: { label: 'Revenue' },
    ...Object.fromEntries(byStatus.map((d) => [d.status, { label: d.status, color: d.fill }])),
  };

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard tone="emerald" label={t('analytics.financial.revenuePaid')} value={zl(kpis.revenue)} icon={<Wallet className="size-4" />} sub={t('analytics.financial.revenuePaidSub', { count: kpis.paidCount })} />
        <StatCard tone="blue" label={t('analytics.financial.aov')} value={zl(kpis.aov)} icon={<Receipt className="size-4" />} sub={t('analytics.financial.aovSub')} />
        <StatCard tone="violet" label={t('analytics.financial.orders')} value={String(kpis.orderCount)} icon={<ShoppingCart className="size-4" />} sub={t('analytics.financial.ordersSub')} />
        <StatCard tone="amber" label={t('analytics.financial.discounts')} value={zl(kpis.discounts)} icon={<BadgePercent className="size-4" />} sub={t('analytics.financial.discountsSub')} />
      </div>

      {/* Revenue over time + revenue by status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle>{t('analytics.financial.revenueOverTime')}</CardTitle>
            <Select value={granularity} onValueChange={(v) => setGranularity(v as Period)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t('analytics.financial.granularity.daily')}</SelectItem>
                <SelectItem value="weekly">{t('analytics.financial.granularity.weekly')}</SelectItem>
                <SelectItem value="monthly">{t('analytics.financial.granularity.monthly')}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {series.length === 0 ? (
              <Empty />
            ) : (
              <ChartContainer config={areaConfig} className="h-[300px] w-full">
                <AreaChart data={series} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillFinRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART.blue} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART.blue} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v) => `${v} zł`} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${Number(v).toFixed(2)} zł`} />} />
                  <Area dataKey="revenueZl" type="monotone" stroke={CHART.blue} strokeWidth={2} fill="url(#fillFinRevenue)" />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('analytics.financial.revenueByStatus')}</CardTitle></CardHeader>
          <CardContent>
            {byStatus.length === 0 ? (
              <Empty />
            ) : (
              <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[300px]">
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v) => zlShort((v as number) * 100)} />} />
                  <Pie data={byStatus} dataKey="revenue" nameKey="status" innerRadius={64} strokeWidth={4}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          const total = byStatus.reduce((s, d) => s + d.revenue, 0);
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 4} className="fill-foreground text-xl font-bold">
                                {zlShort(total)}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-muted-foreground text-xs">
                                {t('analytics.financial.total')}
                              </tspan>
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
      </div>

      {/* Top products by revenue */}
      <Card>
        <CardHeader><CardTitle>{t('analytics.financial.topProducts')}</CardTitle></CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <Empty />
          ) : (
            <ChartContainer config={barConfig} className="h-[320px] w-full">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 8, right: 44 }}>
                <XAxis type="number" dataKey="revenue" hide />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={150} tickMargin={4} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v) => `${v} zł`} />} />
                <Bar dataKey="revenue" fill={CHART.emerald} radius={6} barSize={26}>
                  <LabelList dataKey="revenue" position="right" formatter={(v: React.ReactNode) => `${v} zł`} className="fill-foreground text-xs" />
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Empty() {
  const { t } = useTranslation();
  return <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">{t('analytics.empty')}</div>;
}
