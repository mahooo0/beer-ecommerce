'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AnalyticsPanel, MiniBar } from '@/components/AnalyticsPanel';

interface DashboardData {
  totalItems: number;
  totalWarehouses: number;
  lowStockCount: number;
  recentMovements: any[];
}

interface LowStockAlert {
  id: string;
  productName: string;
  sku: string;
  warehouseName: string;
  available: number;
  threshold: number;
}

export default function InventoryDashboardPage() {
  const { getToken } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const [dashboardRes, alertsRes] = await Promise.all([
        api.inventory.dashboard(token || undefined),
        api.inventory.alerts(token || undefined),
      ]);

      if (dashboardRes.success && dashboardRes.data) {
        setDashboardData(dashboardRes.data);
      }
      if (alertsRes.success && alertsRes.data) {
        setAlerts(alertsRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">{error}</div>
    );
  }

  const stats = [
    {
      label: 'Total SKUs Tracked',
      value: dashboardData?.totalItems ?? 0,
      highlight: false,
    },
    {
      label: 'Total Warehouses',
      value: dashboardData?.totalWarehouses ?? 0,
      highlight: false,
    },
    {
      label: 'Low Stock Alerts',
      value: dashboardData?.lowStockCount ?? 0,
      highlight: (dashboardData?.lowStockCount ?? 0) > 0,
    },
    {
      label: 'Recent Movements',
      value: dashboardData?.recentMovements?.length ?? 0,
      highlight: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-lg border p-6 shadow-sm ${
              stat.highlight
                ? 'border-destructive/30 bg-destructive/10'
                : 'border bg-card'
            }`}
          >
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p
              className={`mt-2 text-3xl font-bold ${
                stat.highlight ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Stock Distribution */}
      {dashboardData && (
        <AnalyticsPanel title="Stock Distribution" defaultOpen={false}>
          <div className="space-y-2">
            <MiniBar label="SKUs Tracked" value={dashboardData.totalItems} max={dashboardData.totalItems} color="bg-blue-500" />
            <MiniBar label="Low Stock" value={dashboardData.lowStockCount} max={dashboardData.totalItems} color="bg-amber-500" />
            <MiniBar label="Healthy Stock" value={dashboardData.totalItems - dashboardData.lowStockCount} max={dashboardData.totalItems} color="bg-green-500" />
          </div>
        </AnalyticsPanel>
      )}

      {/* Low Stock Alerts Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Low Stock Alerts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Items at or below their restock threshold
          </p>
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No low stock alerts. All items are sufficiently stocked.</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Threshold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => {
                  const isCritical = alert.available === 0;
                  return (
                    <TableRow
                      key={alert.id}
                      className={
                        isCritical
                          ? 'bg-destructive/5 hover:bg-destructive/10'
                          : 'bg-amber-500/5 hover:bg-amber-500/10'
                      }
                    >
                      <TableCell className="font-medium text-foreground">
                        {alert.productName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {alert.sku}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {alert.warehouseName}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                            isCritical
                              ? 'bg-destructive/15 text-destructive'
                              : 'bg-amber-500/15 text-amber-500'
                          }`}
                        >
                          {alert.available}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {alert.threshold}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
