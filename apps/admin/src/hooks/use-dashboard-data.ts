'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { Order } from '@repo/types';

interface OrderStats {
  totalOrders: number;
  revenue: number;
  avgOrderValue: number;
  byStatus: Record<string, number>;
}

interface DashboardData {
  stats: OrderStats | null;
  recentOrders: Order[];
  timeseriesOrders: Order[];
  inventoryAlerts: any[];
  customerCount: number;
  loading: boolean;
  error: string;
  refetch: () => void;
}

export function useDashboardData(dateRange: { from?: string; to?: string }): DashboardData {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [timeseriesOrders, setTimeseriesOrders] = useState<Order[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = (await getToken()) || undefined;

      const [statsRes, recentRes, timeseriesRes, alertsRes, usersRes] = await Promise.allSettled([
        api.orders.getStats(token),
        api.orders.getAll({ limit: 10, token }),
        api.orders.getAll({
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          limit: 500,
          token,
        }),
        api.inventory.alerts(token),
        api.users.getAll({ limit: 1, token }),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        setStats(statsRes.value.data);
      }
      if (recentRes.status === 'fulfilled') {
        setRecentOrders(recentRes.value.data || []);
      }
      if (timeseriesRes.status === 'fulfilled') {
        setTimeseriesOrders(timeseriesRes.value.data || []);
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value.data) {
        setInventoryAlerts(alertsRes.value.data);
      }
      if (usersRes.status === 'fulfilled') {
        setCustomerCount(usersRes.value.total || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    stats,
    recentOrders,
    timeseriesOrders,
    inventoryAlerts,
    customerCount,
    loading,
    error,
    refetch: fetchAll,
  };
}
