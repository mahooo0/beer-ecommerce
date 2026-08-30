'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAnalyticsData } from '@/hooks/use-analytics-data';
import { useCartAnalytics } from '@/hooks/use-cart-analytics';
import { getDefaultDateRange } from '@/lib/analytics-utils';
import { DateRangeFilter } from '@/components/dashboard/date-range-filter';
import { FinancialTab } from '@/components/analytics/financial-tab';
import { OrdersTab } from '@/components/analytics/orders-tab';
import { ExperienceTab } from '@/components/analytics/experience-tab';
import { AnalyticsKpiStrip } from '@/components/analytics/kpi-strip';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const { orders, orderStats, loading, error } = useAnalyticsData(dateRange);
  const { summary: cartSummary, loading: cartLoading, error: cartError } = useCartAnalytics(dateRange);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('analytics.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('analytics.subtitle')}</p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          <AnalyticsKpiStrip orders={orders} cartSummary={cartSummary} dateRange={dateRange} />
          <Tabs defaultValue="financial">
            <TabsList>
              <TabsTrigger value="financial">{t('analytics.tabs.financial')}</TabsTrigger>
              <TabsTrigger value="orders">{t('analytics.tabs.orders')}</TabsTrigger>
              <TabsTrigger value="experience">{t('analytics.tabs.experience')}</TabsTrigger>
            </TabsList>
            <TabsContent value="financial" className="mt-6">
              <FinancialTab orders={orders} />
            </TabsContent>
            <TabsContent value="orders" className="mt-6">
              <OrdersTab orders={orders} orderStats={orderStats} />
            </TabsContent>
            <TabsContent value="experience" className="mt-6">
              {cartError && (
                <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
                  {cartError}
                </div>
              )}
              {cartLoading ? <Skeleton className="h-[400px] w-full" /> : <ExperienceTab summary={cartSummary} />}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
