'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import type { Order, Product, Category, Brand } from '@repo/types';
import { computeTopProducts, formatCurrency } from '@/lib/analytics-utils';

interface ProductsTabProps {
  orders: Order[];
  products: Product[];
  categories: Category[];
  brands: Brand[];
}

const chartColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export function ProductsTab({ orders, products, categories, brands }: ProductsTabProps) {
  const topProducts = useMemo(() => computeTopProducts(orders, 20), [orders]);

  const categoryDist = useMemo(() => {
    const catMap = new Map<string, { name: string; count: number }>();
    for (const product of products) {
      if (!product.categoryId) continue;
      const cat = categories.find((c) => c.id === product.categoryId);
      const name = cat?.name || 'Uncategorized';
      const existing = catMap.get(name) || { name, count: 0 };
      existing.count += 1;
      catMap.set(name, existing);
    }
    return Array.from(catMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((d, i) => ({ ...d, fill: chartColors[i % chartColors.length] }));
  }, [products, categories]);

  const brandDist = useMemo(() => {
    const brandMap = new Map<string, { name: string; count: number }>();
    for (const product of products) {
      if (!product.brandId) continue;
      const brand = brands.find((b) => b.id === product.brandId);
      const name = brand?.name || 'Unknown';
      const existing = brandMap.get(name) || { name, count: 0 };
      existing.count += 1;
      brandMap.set(name, existing);
    }
    return Array.from(brandMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [products, brands]);

  const categoryConfig: ChartConfig = {
    count: { label: 'Products' },
    ...Object.fromEntries(
      categoryDist.map((d) => [d.name, { label: d.name, color: d.fill }])
    ),
  };

  const brandConfig: ChartConfig = {
    count: {
      label: 'Products',
      color: 'var(--chart-3)',
    },
  };

  return (
    <div className="space-y-6">
      {/* Top products table */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-lg font-medium mb-4">Top Products by Revenue</h3>
        {topProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No product data</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Avg Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((p, i) => (
                <TableRow key={p.productId}>
                  <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{formatCurrency(p.revenue)}</TableCell>
                  <TableCell>{p.quantity}</TableCell>
                  <TableCell>{p.quantity > 0 ? formatCurrency(Math.round(p.revenue / p.quantity)) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category distribution */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-lg font-medium mb-4">Category Distribution</h3>
          {categoryDist.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">No data</div>
          ) : (
            <ChartContainer config={categoryConfig} className="mx-auto aspect-square max-h-[250px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={categoryDist.map((d) => ({ name: d.name, count: d.count, fill: d.fill }))}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={50}
                  strokeWidth={5}
                />
              </PieChart>
            </ChartContainer>
          )}
        </div>

        {/* Brand distribution */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-lg font-medium mb-4">Brand Distribution</h3>
          {brandDist.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">No data</div>
          ) : (
            <ChartContainer config={brandConfig} className="min-h-[250px] w-full">
              <BarChart accessibilityLayer data={brandDist} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </div>
    </div>
  );
}
