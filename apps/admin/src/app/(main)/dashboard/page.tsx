'use client';

import { useState } from 'react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import {
  getDefaultDateRange,
  groupOrdersByPeriod,
  computeStatusDistribution,
  computeTopProducts,
} from '@/lib/analytics-utils';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { OrderStatusChart } from '@/components/dashboard/order-status-chart';
import { RecentOrdersTable } from '@/components/dashboard/recent-orders-table';
import { LowStockAlerts } from '@/components/dashboard/low-stock-alerts';
import { TopProducts } from '@/components/dashboard/top-products';
import { DateRangeFilter } from '@/components/dashboard/date-range-filter';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const { stats, recentOrders, timeseriesOrders, inventoryAlerts, customerCount, loading } =
    useDashboardData(dateRange);

  const timeseries = groupOrdersByPeriod(timeseriesOrders, 'daily');
  const statusDist = stats ? computeStatusDistribution(stats.byStatus) : [];
  const topProducts = computeTopProducts(timeseriesOrders, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <KpiCards
        revenue={stats?.revenue ?? 0}
        totalOrders={stats?.totalOrders ?? 0}
        avgOrderValue={stats?.avgOrderValue ?? 0}
        customerCount={customerCount}
        loading={loading}
      />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart data={timeseries} loading={loading} />
        </div>
        <div>
          <OrderStatusChart
            data={statusDist}
            totalOrders={stats?.totalOrders ?? 0}
            loading={loading}
          />
        </div>
        <div>
          <LowStockAlerts alerts={inventoryAlerts} loading={loading} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <RecentOrdersTable orders={recentOrders} loading={loading} />
        </div>
        <div>
          <TopProducts products={topProducts} loading={loading} />
        </div>
      </div>
    </div>
  );
}
