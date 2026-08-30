'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useTranslation } from 'react-i18next';
import { Wallet, ShoppingCart, Receipt, Percent, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import type { Order, CartAnalyticsSummary } from '@repo/types';
import { StatCard } from './stat-card';
import type { CardTone } from '@/lib/chart-colors';

const zl = (cents: number) => `${(cents / 100).toFixed(2)} zł`;
const compact = (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

/** Percentage change current-vs-previous; null when there's no basis at all. */
function delta(curr: number, prev: number): number | null {
  if (prev <= 0) return null; // no prior-period data → don't fake a +100%
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

const ICONS: Record<string, React.ReactNode> = {
  revenue: <Wallet className="size-4" />,
  orders: <ShoppingCart className="size-4" />,
  aov: <Receipt className="size-4" />,
  conversion: <Percent className="size-4" />,
  abandoned: <ShoppingBag className="size-4" />,
};
const TONES: Record<string, CardTone> = {
  revenue: 'emerald',
  orders: 'blue',
  aov: 'violet',
  conversion: 'amber',
  abandoned: 'rose',
};

/** Store KPIs as colourful stat cards with an honest delta vs the previous period. */
export function AnalyticsKpiStrip({ orders, cartSummary, dateRange }: KpiStripProps) {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [prevOrders, setPrevOrders] = useState<Order[]>([]);

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

    // Conversion can exceed 100% in sparse data; clamp the headline.
    const conversion = cartSummary ? Math.min(100, cartSummary.conversionRate * 100) : 0;
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
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <StatCard
          key={kpi.key}
          tone={TONES[kpi.key]}
          icon={ICONS[kpi.key]}
          label={t(`analyticsKpi.${kpi.key}`)}
          value={kpi.value}
          delta={kpi.delta}
          invertDelta={kpi.invert}
          sub={kpi.delta !== null ? t('analyticsKpi.vsPrevious') : undefined}
        />
      ))}
    </div>
  );
}
