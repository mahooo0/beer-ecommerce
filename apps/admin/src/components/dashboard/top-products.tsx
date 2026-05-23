'use client';

import { formatCurrency } from '@/lib/analytics-utils';
import type { TopProduct } from '@/lib/analytics-utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TopProductsProps {
  products: TopProduct[];
  loading: boolean;
}

export function TopProducts({ products, loading }: TopProductsProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-medium mb-4">Top Products</h2>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No product data</div>
      ) : (
        <div className="space-y-3">
          {products.map((product, i) => (
            <div key={product.productId} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
              <span className="text-sm font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.quantity} units sold</p>
              </div>
              <span className="text-sm font-semibold">{formatCurrency(product.revenue)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
