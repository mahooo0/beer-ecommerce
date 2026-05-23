'use client';

import { useMemo } from 'react';
import { Label, Pie, PieChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { Order } from '@repo/types';
import { computeStatusDistribution, groupOrdersByPeriod } from '@/lib/analytics-utils';

interface OrdersTabProps {
  orders: Order[];
  orderStats: { totalOrders: number; revenue: number; avgOrderValue: number; byStatus: Record<string, number> } | null;
}

export function OrdersTab({ orders, orderStats }: OrdersTabProps) {
  const statusDist = useMemo(
    () => (orderStats ? computeStatusDistribution(orderStats.byStatus) : []),
    [orderStats]
  );

  const timeseries = useMemo(() => groupOrdersByPeriod(orders, 'daily'), [orders]);

  const pieConfig: ChartConfig = {
    count: { label: 'Orders' },
    ...Object.fromEntries(
      statusDist.map((d) => [
        d.status,
        { label: d.status.charAt(0).toUpperCase() + d.status.slice(1).replace('_', ' '), color: d.fill },
      ])
    ),
  };

  const barConfig: ChartConfig = {
    orderCount: {
      label: 'Orders',
      color: 'var(--chart-2)',
    },
  };

  const delivered = orderStats?.byStatus['delivered'] || 0;
  const cancelled = orderStats?.byStatus['cancelled'] || 0;
  const total = orderStats?.totalOrders || 0;
  const fulfillmentRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0';
  const cancellationRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Fulfillment Rate</p>
          <p className="text-2xl font-bold">{fulfillmentRate}%</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Cancellation Rate</p>
          <p className="text-2xl font-bold">{cancellationRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-lg font-medium mb-4">Status Distribution</h3>
          {statusDist.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data</div>
          ) : (
            <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[300px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={statusDist.map((d) => ({ status: d.status, count: d.count, fill: d.fill }))} dataKey="count" nameKey="status" innerRadius={70} strokeWidth={5}>
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                              {total}
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

        {/* Bar chart - orders over time */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-lg font-medium mb-4">Orders Over Time</h3>
          {timeseries.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data</div>
          ) : (
            <ChartContainer config={barConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={timeseries}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orderCount" fill="var(--color-orderCount)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </div>
    </div>
  );
}
