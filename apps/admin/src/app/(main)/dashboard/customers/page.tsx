'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Users,
  UserCheck,
  Wallet,
  TrendingUp,
  Eye,
  ShoppingBag,
  Crown,
  Globe,
  ArrowUpDown,
} from 'lucide-react';
import { api, type AdminUserListItem, type CustomerAggregate } from '@/lib/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type CustomerRow = AdminUserListItem & Omit<CustomerAggregate, 'userId'>;

const EMPTY_AGG = { orders: 0, paidOrders: 0, totalSpent: 0, lastOrderAt: null, firstOrderAt: null };

const zl = (cents: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(cents / 100);

const PAGE_SIZE = 12;

type SortKey = 'spent' | 'orders' | 'recent' | 'joined' | 'name';

export default function CustomersPage() {
  const { t } = useTranslation();
  const { getToken } = useAuth();

  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'RETAIL' | 'WHOLESALE'>('all');
  const [sort, setSort] = useState<SortKey>('spent');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const token = (await getToken()) || undefined;
        const [usersRes, aggRes] = await Promise.all([
          api.users.getAll({ limit: 500, token }),
          api.orders.aggregateByUser(token),
        ]);
        const aggMap = new Map((aggRes.data || []).map((a) => [a.userId, a]));
        const customers: CustomerRow[] = (usersRes.data || [])
          .filter((u) => u.role === 'CUSTOMER')
          .map((u) => {
            const agg = aggMap.get(u.id);
            return {
              ...u,
              orders: agg?.orders ?? EMPTY_AGG.orders,
              paidOrders: agg?.paidOrders ?? EMPTY_AGG.paidOrders,
              totalSpent: agg?.totalSpent ?? EMPTY_AGG.totalSpent,
              lastOrderAt: agg?.lastOrderAt ?? EMPTY_AGG.lastOrderAt,
              firstOrderAt: agg?.firstOrderAt ?? EMPTY_AGG.firstOrderAt,
            };
          });
        if (!cancelled) setRows(customers);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load customers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  // KPIs across the whole customer base (not the filtered view).
  const kpis = useMemo(() => {
    const total = rows.length;
    const buyers = rows.filter((r) => r.orders > 0);
    const revenue = rows.reduce((s, r) => s + r.totalSpent, 0);
    const avgSpend = buyers.length > 0 ? Math.round(revenue / buyers.length) : 0;
    const cutoff = Date.now() - 30 * 86_400_000;
    const newCount = rows.filter((r) => new Date(r.createdAt).getTime() >= cutoff).length;
    const wholesale = rows.filter((r) => r.customerType === 'WHOLESALE').length;
    return { total, buyers: buyers.length, revenue, avgSpend, newCount, wholesale };
  }, [rows]);

  const maxSpent = useMemo(() => Math.max(1, ...rows.map((r) => r.totalSpent)), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = list.filter((r) => {
        const name = `${r.firstName} ${r.lastName}`.toLowerCase();
        return (
          name.includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.phone || '').toLowerCase().includes(q) ||
          (r.country || '').toLowerCase().includes(q)
        );
      });
    }
    if (typeFilter !== 'all') list = list.filter((r) => r.customerType === typeFilter);

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'orders':
          return b.orders - a.orders;
        case 'recent':
          return (
            new Date(b.lastOrderAt || 0).getTime() - new Date(a.lastOrderAt || 0).getTime()
          );
        case 'joined':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'spent':
        default:
          return b.totalSpent - a.totalSpent;
      }
    });
    return sorted;
  }, [rows, search, typeFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 whenever the filters change.
  useEffect(() => setPage(1), [search, typeFilter, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('customers.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('customers.subtitle')}</p>
        </div>
        <span className="text-sm text-muted-foreground">
          {t('customers.count', { count: rows.length })}
        </span>
      </div>

      {/* KPI strip — joined ring style, wired to real data */}
      <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
        <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          <Kpi
            icon={<Users className="size-4 text-blue-600 dark:text-blue-400" />}
            label={t('customers.kpi.total')}
            value={loading ? '—' : String(kpis.total)}
            sub={t('customers.kpi.newThisMonth', { count: kpis.newCount })}
          />
          <Kpi
            icon={<UserCheck className="size-4 text-green-600 dark:text-green-400" />}
            label={t('customers.kpi.buyers')}
            value={loading ? '—' : String(kpis.buyers)}
            sub={t('customers.kpi.wholesale', { count: kpis.wholesale })}
          />
          <Kpi
            icon={<Wallet className="size-4 text-purple-600 dark:text-purple-400" />}
            label={t('customers.kpi.revenue')}
            value={loading ? '—' : zl(kpis.revenue)}
            sub={t('customers.kpi.fromCustomers')}
          />
          <Kpi
            icon={<TrendingUp className="size-4 text-amber-600 dark:text-amber-400" />}
            label={t('customers.kpi.avgSpend')}
            value={loading ? '—' : zl(kpis.avgSpend)}
            sub={t('customers.kpi.perBuyer')}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('customers.filters.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('customers.filters.allTypes')}</SelectItem>
            <SelectItem value="RETAIL">{t('customers.type.RETAIL')}</SelectItem>
            <SelectItem value="WHOLESALE">{t('customers.type.WHOLESALE')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[190px]">
            <ArrowUpDown className="size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spent">{t('customers.sort.spent')}</SelectItem>
            <SelectItem value="orders">{t('customers.sort.orders')}</SelectItem>
            <SelectItem value="recent">{t('customers.sort.recent')}</SelectItem>
            <SelectItem value="joined">{t('customers.sort.joined')}</SelectItem>
            <SelectItem value="name">{t('customers.sort.name')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('customers.columns.customer')}</TableHead>
                <TableHead>{t('customers.columns.contact')}</TableHead>
                <TableHead>{t('customers.columns.country')}</TableHead>
                <TableHead>{t('customers.columns.joined')}</TableHead>
                <TableHead className="text-center">{t('customers.columns.orders')}</TableHead>
                <TableHead>{t('customers.columns.spent')}</TableHead>
                <TableHead>{t('customers.columns.type')}</TableHead>
                <TableHead className="text-right">{t('customers.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <div className="h-11 animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="py-12 text-center text-muted-foreground">
                      {t('customers.empty')}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((c) => {
                  const fullName = `${c.firstName} ${c.lastName}`.trim() || c.email;
                  const initials =
                    `${c.firstName[0] ?? ''}${c.lastName[0] ?? ''}`.toUpperCase() ||
                    c.email[0]?.toUpperCase() ||
                    '?';
                  return (
                    <TableRow key={c.id} className="group">
                      {/* Customer */}
                      <TableCell>
                        <Link
                          href={`/dashboard/customers/${c.id}`}
                          className="flex items-center gap-3"
                        >
                          <Avatar className="size-9 ring-1 ring-foreground/10">
                            {c.avatar ? <AvatarImage src={c.avatar} alt={fullName} /> : null}
                            <AvatarFallback className="text-xs font-medium">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground group-hover:underline">
                              {fullName}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {c.email}
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      {/* Contact */}
                      <TableCell className="text-sm text-muted-foreground">
                        {c.phone || <span className="text-muted-foreground/50">—</span>}
                      </TableCell>
                      {/* Country */}
                      <TableCell className="text-sm text-muted-foreground">
                        {c.country ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Globe className="size-3.5 text-muted-foreground/70" />
                            {c.country}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      {/* Joined */}
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString('pl-PL', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      {/* Orders */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm tabular-nums">
                          <ShoppingBag className="size-3.5 text-muted-foreground/70" />
                          {c.orders}
                        </span>
                      </TableCell>
                      {/* Spent + mini bar */}
                      <TableCell className="min-w-[140px]">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold tabular-nums text-foreground">
                            {zl(c.totalSpent)}
                          </div>
                          <Progress
                            value={(c.totalSpent / maxSpent) * 100}
                            className="h-1.5 bg-muted *:data-[slot=progress-indicator]:bg-primary/70"
                          />
                        </div>
                      </TableCell>
                      {/* Type */}
                      <TableCell>
                        {c.customerType === 'WHOLESALE' ? (
                          <Badge
                            variant="outline"
                            className="gap-1 border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:text-amber-300"
                          >
                            <Crown className="size-3" />
                            {t('customers.type.WHOLESALE')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            {t('customers.type.RETAIL')}
                          </Badge>
                        )}
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/customers/${c.id}`}>
                            <Eye className="size-4" />
                            <span className="sr-only sm:not-sr-only sm:ml-1.5">
                              {t('customers.columns.view')}
                            </span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {t('customers.pagination.showing', {
              from: (page - 1) * PAGE_SIZE + 1,
              to: Math.min(page * PAGE_SIZE, filtered.length),
              total: filtered.length,
            })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t('customers.pagination.previous')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t('customers.pagination.pageOf', { page, totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t('customers.pagination.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="rounded-none border-0 shadow-none ring-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
        <span className="flex size-8 items-center justify-center rounded-lg border bg-muted/50">
          {icon}
        </span>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-semibold leading-none tracking-tight tabular-nums">
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
