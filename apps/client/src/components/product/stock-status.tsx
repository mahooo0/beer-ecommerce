'use client';

const LOW_STOCK_THRESHOLD = 5;

interface StockStatusProps {
  stock: number;
}

export function StockStatus({ stock }: StockStatusProps) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-error-primary">
        <span className="w-2 h-2 rounded-full bg-error-solid shrink-0" />
        Out of Stock
      </span>
    );
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-utility-warning-700">
        <span className="w-2 h-2 rounded-full bg-utility-warning-500 shrink-0" />
        Low Stock ({stock} left)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-utility-success-700">
      <span className="w-2 h-2 rounded-full bg-utility-success-600 shrink-0" />
      In Stock
    </span>
  );
}
