'use client';

import { useTranslation } from 'react-i18next';
import { ShoppingCart, CreditCard, TrendingDown, Percent, Eye, Search } from 'lucide-react';
import type { CartAnalyticsSummary, AbandonedCartRow } from '@repo/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CHART } from '@/lib/chart-colors';
import { StatCard } from './stat-card';

interface ExperienceTabProps {
  summary: CartAnalyticsSummary | null;
}

const zl = (cents: number) => `${(cents / 100).toFixed(2)} zł`;
const shortId = (id: string) => (id.length > 10 ? `${id.slice(0, 8)}…` : id);

// Funnel step colours: warm→cool as the user progresses to purchase.
const FUNNEL_COLORS: Record<string, string> = {
  productViews: CHART.blue,
  addToCart: CHART.cyan,
  checkoutStarted: CHART.amber,
  purchased: CHART.emerald,
};

export function ExperienceTab({ summary }: ExperienceTabProps) {
  const { t } = useTranslation();

  if (!summary) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border text-muted-foreground">
        {t('cartAnalytics.empty')}
      </div>
    );
  }

  const { funnel, conversionRate, abandonedCheckouts, abandonedCarts, topViewed, topSearches } = summary;
  const funnelSteps = [
    { key: 'productViews', value: funnel.productViews },
    { key: 'addToCart', value: funnel.addToCart },
    { key: 'checkoutStarted', value: funnel.checkoutStarted },
    { key: 'purchased', value: funnel.purchased },
  ];
  const funnelMax = Math.max(1, ...funnelSteps.map((s) => s.value));
  // Conversion can exceed 100% in edge data (more purchases than tracked adds);
  // clamp the headline so it reads sanely.
  const convDisplay = Math.min(100, conversionRate * 100);
  const maxViewed = Math.max(1, ...topViewed.map((p) => p.count));
  const maxSearch = Math.max(1, ...topSearches.map((s) => s.count));

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard tone="emerald" label={t('cartAnalytics.kpi.conversion')} value={`${convDisplay.toFixed(1)}%`} icon={<Percent className="size-4" />} sub={t('cartAnalytics.kpi.conversionHint')} />
        <StatCard tone="amber" label={t('cartAnalytics.kpi.abandonedCheckouts')} value={String(abandonedCheckouts.count)} icon={<CreditCard className="size-4" />} sub={`${zl(abandonedCheckouts.valueCents)} ${t('cartAnalytics.kpi.recoverable')}`} />
        <StatCard tone="rose" label={t('cartAnalytics.kpi.abandonedCarts')} value={String(abandonedCarts.count)} icon={<ShoppingCart className="size-4" />} sub={`${zl(abandonedCarts.valueCents)} ${t('cartAnalytics.kpi.recoverable')}`} />
        <StatCard tone="violet" label={t('cartAnalytics.kpi.purchases')} value={String(funnel.purchased)} icon={<TrendingDown className="size-4" />} sub={t('cartAnalytics.kpi.purchasesHint')} />
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader><CardTitle>{t('cartAnalytics.funnel.title')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {funnelSteps.map((step, i) => {
            const prev = i > 0 ? funnelSteps[i - 1]!.value : null;
            const dropPct = prev && prev > 0 ? Math.max(0, Math.round(((prev - step.value) / prev) * 100)) : null;
            const color = FUNNEL_COLORS[step.key] ?? CHART.blue;
            return (
              <div key={step.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{t(`cartAnalytics.funnel.${step.key}`)}</span>
                  <span className="text-muted-foreground">
                    {step.value.toLocaleString()}
                    {dropPct !== null && (
                      <span className="ml-2 text-rose-500 text-xs">−{dropPct}% {t('cartAnalytics.funnel.dropoff')}</span>
                    )}
                  </span>
                </div>
                <div className="h-3.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(step.value / funnelMax) * 100}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Abandoned checkouts + carts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AbandonedTable title={t('cartAnalytics.abandonedCheckouts.title')} subtitle={t('cartAnalytics.abandonedCheckouts.subtitle')} rows={summary.abandonedCheckoutRows} emptyLabel={t('cartAnalytics.abandonedCheckouts.empty')} t={t} />
        <AbandonedTable title={t('cartAnalytics.abandonedCarts.title')} subtitle={t('cartAnalytics.abandonedCarts.subtitle')} rows={summary.abandonedCartRows} emptyLabel={t('cartAnalytics.abandonedCarts.empty')} t={t} />
      </div>

      {/* Top viewed + top searches (ranked bars) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="size-4 text-muted-foreground" />{t('cartAnalytics.topViewed.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {topViewed.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('cartAnalytics.topViewed.empty')}</p>
            ) : (
              <ul className="space-y-2.5">
                {topViewed.map((p) => (
                  <li key={p.productId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="min-w-0 truncate pr-2">{p.name}</span>
                      <span className="tabular-nums text-muted-foreground">{p.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${(p.count / maxViewed) * 100}%`, backgroundColor: CHART.blue }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="size-4 text-muted-foreground" />{t('cartAnalytics.topSearches.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {topSearches.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('cartAnalytics.topSearches.empty')}</p>
            ) : (
              <ul className="space-y-2.5">
                {topSearches.map((s) => (
                  <li key={s.query} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="min-w-0 truncate pr-2">{s.query}</span>
                      <span className="tabular-nums text-muted-foreground">{s.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${(s.count / maxSearch) * 100}%`, backgroundColor: CHART.violet }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AbandonedTable({
  title,
  subtitle,
  rows,
  emptyLabel,
  t,
}: {
  title: string;
  subtitle: string;
  rows: AbandonedCartRow[];
  emptyLabel: string;
  t: (key: string) => string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className={cn('text-sm text-muted-foreground')}>{emptyLabel}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">{t('cartAnalytics.table.customer')}</th>
                  <th className="py-2 pr-3 text-right font-medium">{t('cartAnalytics.table.items')}</th>
                  <th className="py-2 pr-3 text-right font-medium">{t('cartAnalytics.table.value')}</th>
                  <th className="py-2 text-right font-medium">{t('cartAnalytics.table.lastSeen')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.sessionId}-${i}`} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <div className="flex flex-col">
                        <span className="max-w-[220px] truncate">
                          {r.email ?? (r.userId ? t('cartAnalytics.table.registered') : t('cartAnalytics.table.guest'))}
                        </span>
                        <span className="text-muted-foreground text-xs">{shortId(r.sessionId)}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{r.itemCount}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{zl(r.valueCents)}</td>
                    <td className="py-2 whitespace-nowrap text-right text-muted-foreground">
                      {new Date(r.lastActivityAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
