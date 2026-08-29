'use client';

import { useTranslation } from 'react-i18next';
import { ShoppingCart, CreditCard, TrendingDown, Percent } from 'lucide-react';
import type { CartAnalyticsSummary, AbandonedCartRow } from '@repo/types';

interface CartsTabProps {
  summary: CartAnalyticsSummary | null;
}

const zl = (cents: number) => `${(cents / 100).toFixed(2)} zł`;

function shortId(id: string) {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

export function CartsTab({ summary }: CartsTabProps) {
  const { t } = useTranslation();

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground rounded-lg border">
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

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Percent className="size-4" />}
          label={t('cartAnalytics.kpi.conversion')}
          value={`${(conversionRate * 100).toFixed(1)}%`}
          hint={t('cartAnalytics.kpi.conversionHint')}
        />
        <KpiCard
          icon={<CreditCard className="size-4" />}
          label={t('cartAnalytics.kpi.abandonedCheckouts')}
          value={String(abandonedCheckouts.count)}
          hint={`${zl(abandonedCheckouts.valueCents)} ${t('cartAnalytics.kpi.recoverable')}`}
        />
        <KpiCard
          icon={<ShoppingCart className="size-4" />}
          label={t('cartAnalytics.kpi.abandonedCarts')}
          value={String(abandonedCarts.count)}
          hint={`${zl(abandonedCarts.valueCents)} ${t('cartAnalytics.kpi.recoverable')}`}
        />
        <KpiCard
          icon={<TrendingDown className="size-4" />}
          label={t('cartAnalytics.kpi.purchases')}
          value={String(funnel.purchased)}
          hint={t('cartAnalytics.kpi.purchasesHint')}
        />
      </div>

      {/* Funnel */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-lg font-medium mb-4">{t('cartAnalytics.funnel.title')}</h3>
        <div className="space-y-3">
          {funnelSteps.map((step, i) => {
            const prev = i > 0 ? funnelSteps[i - 1]!.value : null;
            const dropPct =
              prev && prev > 0 ? Math.max(0, Math.round(((prev - step.value) / prev) * 100)) : null;
            return (
              <div key={step.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{t(`cartAnalytics.funnel.${step.key}`)}</span>
                  <span className="text-muted-foreground">
                    {step.value.toLocaleString()}
                    {dropPct !== null && (
                      <span className="ml-2 text-xs text-red-500">
                        −{dropPct}% {t('cartAnalytics.funnel.dropoff')}
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-3 w-full rounded bg-muted overflow-hidden">
                  <div
                    className="h-full rounded bg-[var(--chart-1)]"
                    style={{ width: `${(step.value / funnelMax) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Abandoned checkouts + carts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AbandonedTable
          title={t('cartAnalytics.abandonedCheckouts.title')}
          subtitle={t('cartAnalytics.abandonedCheckouts.subtitle')}
          rows={summary.abandonedCheckoutRows}
          emptyLabel={t('cartAnalytics.abandonedCheckouts.empty')}
          t={t}
        />
        <AbandonedTable
          title={t('cartAnalytics.abandonedCarts.title')}
          subtitle={t('cartAnalytics.abandonedCarts.subtitle')}
          rows={summary.abandonedCartRows}
          emptyLabel={t('cartAnalytics.abandonedCarts.empty')}
          t={t}
        />
      </div>

      {/* Top viewed + top searches */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-lg font-medium mb-3">{t('cartAnalytics.topViewed.title')}</h3>
          {topViewed.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('cartAnalytics.topViewed.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {topViewed.map((p) => (
                <li key={p.productId} className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2">{p.name}</span>
                  <span className="text-muted-foreground tabular-nums">{p.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-lg font-medium mb-3">{t('cartAnalytics.topSearches.title')}</h3>
          {topSearches.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('cartAnalytics.topSearches.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {topSearches.map((s) => (
                <li key={s.query} className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2">{s.query}</span>
                  <span className="text-muted-foreground tabular-nums">{s.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
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
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 pr-3 font-medium">{t('cartAnalytics.table.customer')}</th>
                <th className="py-2 pr-3 font-medium text-right">{t('cartAnalytics.table.items')}</th>
                <th className="py-2 pr-3 font-medium text-right">{t('cartAnalytics.table.value')}</th>
                <th className="py-2 font-medium text-right">{t('cartAnalytics.table.lastSeen')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.sessionId}-${i}`} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    <div className="flex flex-col">
                      <span className="truncate max-w-[220px]">
                        {r.email ?? (r.userId ? t('cartAnalytics.table.registered') : t('cartAnalytics.table.guest'))}
                      </span>
                      <span className="text-xs text-muted-foreground">{shortId(r.sessionId)}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{r.itemCount}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{zl(r.valueCents)}</td>
                  <td className="py-2 text-right text-muted-foreground whitespace-nowrap">
                    {new Date(r.lastActivityAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
