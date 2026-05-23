'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface InventoryAlert {
  id: string;
  variantId: string;
  warehouseId: string;
  quantity: number;
  reserved: number;
  lowStockThreshold: number;
  available: number;
  sku: string;
  productName: string;
  warehouseName: string;
}

interface LowStockAlertsProps {
  alerts: InventoryAlert[];
  loading: boolean;
}

export function LowStockAlerts({ alerts, loading }: LowStockAlertsProps) {
  const top5 = alerts.slice(0, 5);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Low Stock Alerts</h2>
        <Link href="/dashboard/inventory" className="text-sm text-primary hover:underline">
          View All
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : top5.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No low stock alerts</div>
      ) : (
        <div className="space-y-3">
          {top5.map((alert) => {
            const isOut = alert.available <= 0;
            return (
              <div key={alert.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                <AlertTriangle className={`h-4 w-4 shrink-0 ${isOut ? 'text-red-500' : 'text-amber-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {alert.productName || alert.sku}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.available} available · Threshold: {alert.lowStockThreshold}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${isOut ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
                >
                  {isOut ? 'Out' : 'Low'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
