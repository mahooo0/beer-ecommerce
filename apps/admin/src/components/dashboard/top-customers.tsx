'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface TopCustomer {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  orders: number;
  totalSpent: number;
}

const zl = (cents: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(cents / 100);

/**
 * Self-contained "top spenders" widget for the overview — merges the customer
 * list with the per-customer order aggregation and shows the biggest buyers.
 */
export function TopCustomers() {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [rows, setRows] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const token = (await getToken()) || undefined;
        const [usersRes, aggRes] = await Promise.all([
          api.users.getAll({ limit: 500, token }),
          api.orders.aggregateByUser(token),
        ]);
        const usersById = new Map((usersRes.data || []).map((u) => [u.id, u]));
        const top = (aggRes.data || [])
          .map((a) => {
            const u = usersById.get(a.userId);
            if (!u || u.role !== 'CUSTOMER') return null;
            return {
              id: u.id,
              name: `${u.firstName} ${u.lastName}`.trim() || u.email,
              email: u.email,
              avatar: u.avatar,
              orders: a.orders,
              totalSpent: a.totalSpent,
            } satisfies TopCustomer;
          })
          .filter((x): x is TopCustomer => x !== null)
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 6);
        if (!cancelled) setRows(top);
      } catch {
        // Non-critical widget.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const maxSpent = useMemo(() => Math.max(1, ...rows.map((r) => r.totalSpent)), [rows]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>{t('overview.topCustomers.title')}</CardTitle>
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('overview.topCustomers.viewAll')}
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('overview.topCustomers.empty')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
            {rows.map((c, i) => (
              <Link
                key={c.id}
                href={`/dashboard/customers/${c.id}`}
                className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
              >
                <span className="w-4 text-center text-xs font-semibold text-muted-foreground tabular-nums">
                  {i + 1}
                </span>
                <Avatar className="size-9 ring-1 ring-foreground/10">
                  {c.avatar ? <AvatarImage src={c.avatar} alt={c.name} /> : null}
                  <AvatarFallback className="text-xs font-medium">
                    {(c.name[0] ?? '?').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium group-hover:underline">{c.name}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress
                      value={(c.totalSpent / maxSpent) * 100}
                      className="h-1.5 flex-1 bg-muted *:data-[slot=progress-indicator]:bg-primary/70"
                    />
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ShoppingBag className="size-3" />
                      {c.orders}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums">{zl(c.totalSpent)}</span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
