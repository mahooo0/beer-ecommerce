'use client';

import { Label, Pie, PieChart } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { StatusDistributionItem } from '@/lib/analytics-utils';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderStatusChartProps {
  data: StatusDistributionItem[];
  totalOrders: number;
  loading: boolean;
}

export function OrderStatusChart({ data, totalOrders, loading }: OrderStatusChartProps) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-[250px] w-full rounded-full mx-auto max-w-[250px]" />
      </div>
    );
  }

  const chartConfig: ChartConfig = {
    count: { label: 'Orders' },
    ...Object.fromEntries(
      data.map((d) => [
        d.status,
        { label: d.status.charAt(0).toUpperCase() + d.status.slice(1).replace('_', ' '), color: d.fill },
      ])
    ),
  };

  const chartData = data.map((d) => ({
    status: d.status,
    count: d.count,
    fill: d.fill,
  }));

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-medium mb-4">Order Status</h2>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
          No order data
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {totalOrders.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          Orders
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
    </div>
  );
}
