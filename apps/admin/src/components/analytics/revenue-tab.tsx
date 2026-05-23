'use client';

import { useState, useMemo } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Order } from '@repo/types';
import { groupOrdersByPeriod, formatCurrency, type Period } from '@/lib/analytics-utils';

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

interface RevenueTabProps {
  orders: Order[];
}

export function RevenueTab({ orders }: RevenueTabProps) {
  const [granularity, setGranularity] = useState<Period>('daily');

  const timeseries = useMemo(
    () => groupOrdersByPeriod(orders, granularity),
    [orders, granularity]
  );

  const chartData = timeseries.map((d) => ({
    label: d.label,
    revenue: d.revenue / 100,
  }));

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgDaily = timeseries.length > 0 ? totalRevenue / timeseries.length : 0;
  const peakDay = timeseries.reduce(
    (max, d) => (d.revenue > max.revenue ? d : max),
    { label: '-', revenue: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Revenue Analysis</h3>
        <Select value={granularity} onValueChange={(v) => setGranularity(v as Period)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground rounded-lg border">
          No revenue data for selected period
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-4">
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <AreaChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => `$${Number(value).toFixed(2)}`} />} />
              <defs>
                <linearGradient id="fillRevenueAnalytics" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                dataKey="revenue"
                type="monotone"
                fill="url(#fillRevenueAnalytics)"
                fillOpacity={0.4}
                stroke="var(--color-revenue)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avg per Period</p>
          <p className="text-2xl font-bold">{formatCurrency(avgDaily)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Peak Period</p>
          <p className="text-2xl font-bold">{formatCurrency(peakDay.revenue)}</p>
          <p className="text-xs text-muted-foreground">{peakDay.label}</p>
        </div>
      </div>
    </div>
  );
}
