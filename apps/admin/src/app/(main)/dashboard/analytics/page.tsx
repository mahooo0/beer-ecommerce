'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAnalyticsData } from '@/hooks/use-analytics-data';
import { getDefaultDateRange } from '@/lib/analytics-utils';
import { DateRangeFilter } from '@/components/dashboard/date-range-filter';
import { RevenueTab } from '@/components/analytics/revenue-tab';
import { OrdersTab } from '@/components/analytics/orders-tab';
import { ProductsTab } from '@/components/analytics/products-tab';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const { orders, products, categories, brands, orderStats, loading, error } =
    useAnalyticsData(dateRange);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <Tabs defaultValue="revenue">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>
          <TabsContent value="revenue" className="mt-6">
            <RevenueTab orders={orders} />
          </TabsContent>
          <TabsContent value="orders" className="mt-6">
            <OrdersTab orders={orders} orderStats={orderStats} />
          </TabsContent>
          <TabsContent value="products" className="mt-6">
            <ProductsTab orders={orders} products={products} categories={categories} brands={brands} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
