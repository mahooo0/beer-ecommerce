'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { CartAnalyticsSummary } from '@repo/types';

interface CartAnalyticsState {
  summary: CartAnalyticsSummary | null;
  loading: boolean;
  error: string;
  reload: () => void;
}

/** Loads the behavioral-analytics summary (funnel + abandoned carts). */
export function useCartAnalytics(dateRange: { from?: string; to?: string }): CartAnalyticsState {
  const { getToken } = useAuth();
  const [summary, setSummary] = useState<CartAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = (await getToken()) || undefined;
      const res = await api.analytics.getSummary({ from: dateRange.from, to: dateRange.to, token });
      setSummary(res.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart analytics');
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, reload: fetchSummary };
}
