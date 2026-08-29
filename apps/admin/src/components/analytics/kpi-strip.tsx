'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useTranslation } from 'react-i18next';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { Order, CartAnalyticsSummary } from '@repo/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const zl = (cents: number) => `${(cents / 100).toFixed(2)} zł`;
const compact = (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

/** Percentage change current-vs-previous; null when there's no basis. */
function delta(curr: number, prev: number): number | null {
  if (prev <= 0) return curr > 0 ? 100 : null;
  return ((curr - prev) / prev) * 100;
}

/** Previous equal-length period immediately before [from, to]. */
function previousRange(from?: string, to?: string): { from?: string; to?: string } {
  if (!from || !to) return {};
  const f = new Date(from);
  const t = new Date(to);
  const days = Math.max(1, Math.round((t.getTime() - f.getTime()) / 86_400_000) + 1);
  const prevTo = new Date(f.getTime() - 86_400_000);
  const prevFrom = new Date(prevTo.getTime() - (days - 1) * 86_400_000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: fmt(prevFrom), to: fmt(prevTo) };
}

interface KpiStripProps {
  orders: Order[];
  cartSummary: CartAnalyticsSummary | null;
  dateRange: { from?: string; to?: string };
}

/**
 * Store KPIs in the template's KPI-strip visual style, wired to real data:
 * period revenue / orders / AOV (with delta vs the previous equal period) plus
 * conversion + abandoned-cart signals from the behavioral funnel.
 */
export function AnalyticsKpiStrip({ orders, cartSummary, dateRange }: KpiStripProps) {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [prevOrders, setPrevOrders] = useState<Order[]>([]);

  // Fetch the previous equal-length period to compute deltas.
  useEffect(() => {
    const prev = previousRange(dateRange.from, dateRange.to);
    if (!prev.from || !prev.to) {
      setPrevOrders([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = (await getToken()) || undefined;
        const res = await api.orders.getAll({ dateFrom: prev.from, dateTo: prev.to, limit: 500, token });
        if (!cancelled) setPrevOrders(res.data || []);
      } catch {
        if (!cancelled) setPrevOrders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dateRange.from, dateRange.to, getToken]);

  const kpis = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const count = orders.length;
    const aov = count > 0 ? Math.round(revenue / count) : 0;
    const prevRevenue = prevOrders.reduce((s, o) => s + o.totalAmount, 0);
    const prevCount = prevOrders.length;
    const prevAov = prevCount > 0 ? Math.round(prevRevenue / prevCount) : 0;

    const conversion = cartSummary ? cartSummary.conversionRate * 100 : 0;
    const abandoned = cartSummary
      ? cartSummary.abandonedCheckouts.count + cartSummary.abandonedCarts.count
      : 0;

    return [
      { key: 'revenue', value: zl(revenue), delta: delta(revenue, prevRevenue), invert: false },
      { key: 'orders', value: compact(count), delta: delta(count, prevCount), invert: false },
      { key: 'aov', value: zl(aov), delta: delta(aov, prevAov), invert: false },
      { key: 'conversion', value: `${conversion.toFixed(1)}%`, delta: null, invert: false },
      { key: 'abandoned', value: compact(abandoned), delta: null, invert: true },
    ];
  }, [orders, prevOrders, cartSummary]);

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
      <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {kpis.map((kpi) => {
          const up = kpi.delta !== null && kpi.delta >= 0;
          // For "good-when-lower" metrics (abandoned), an increase is bad.
          const positive = kpi.delta === null ? null : kpi.invert ? !up : up;
          return (
            <Card key={kpi.key} className="rounded-none border-0 shadow-none ring-0">
              <CardHeader>
                <CardTitle className="font-normal text-muted-foreground text-sm">
                  {t(`analyticsKpi.${kpi.key}`)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-2xl leading-none tracking-tight tabular-nums">{kpi.value}</div>
                  {kpi.delta !== null && (
                    <Badge
                      className={cn(
                        positive
                          ? 'bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                          : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                      {Math.abs(kpi.delta).toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">{t('analyticsKpi.vsPrevious')}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
