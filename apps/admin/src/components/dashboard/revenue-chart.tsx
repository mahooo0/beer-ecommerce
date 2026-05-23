'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { TimeSeriesPoint } from '@/lib/analytics-utils';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

interface RevenueChartProps {
  data: TimeSeriesPoint[];
  loading: boolean;
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-[250px] w-full" />
      </div>
    );
  }

  const chartData = data.map((d) => ({
    label: d.label,
    revenue: d.revenue / 100,
  }));

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-medium mb-4">Revenue Over Time</h2>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
          No data for selected period
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <AreaChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `$${Number(value).toFixed(2)}`}
                />
              }
            />
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              fillOpacity={0.4}
              stroke="var(--color-revenue)"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}
