'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { Order, Product, Category, Brand } from '@repo/types';

interface AnalyticsData {
  orders: Order[];
  products: Product[];
  categories: Category[];
  brands: Brand[];
  orderStats: { totalOrders: number; revenue: number; avgOrderValue: number; byStatus: Record<string, number> } | null;
  loading: boolean;
  error: string;
}

export function useAnalyticsData(dateRange: { from?: string; to?: string }): AnalyticsData {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [orderStats, setOrderStats] = useState<AnalyticsData['orderStats']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = (await getToken()) || undefined;

      const [ordersRes, productsRes, categoriesRes, brandsRes, statsRes] = await Promise.allSettled([
        api.orders.getAll({ dateFrom: dateRange.from, dateTo: dateRange.to, limit: 500, token }),
        api.products.getAll({ limit: 100, token }),
        api.categories.getAll(token),
        api.brands.getAll({ limit: 100, token }),
        api.orders.getStats(token),
      ]);

      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data || []);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data || []);
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data) setCategories(categoriesRes.value.data);
      if (brandsRes.status === 'fulfilled') setBrands(brandsRes.value.data || []);
      if (statsRes.status === 'fulfilled' && statsRes.value.data) setOrderStats(statsRes.value.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { orders, products, categories, brands, orderStats, loading, error };
}
