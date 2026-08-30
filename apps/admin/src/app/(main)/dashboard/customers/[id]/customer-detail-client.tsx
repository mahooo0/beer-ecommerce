'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useTranslation } from 'react-i18next';
import {
  Label,
  Pie,
  PieChart,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  Mail,
  Phone,
  CalendarDays,
  Clock,
  MapPin,
  Star,
  Heart,
  Wallet,
  ShoppingBag,
  Receipt,
  TrendingUp,
  Crown,
  BadgePercent,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Order, LoyaltyTier } from '@repo/types';
import { cn } from '@/lib/utils';
import { ORDER_STATUS_COLOR, CHART } from '@/lib/chart-colors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CopyId } from '../../users/copy-id';
import { RoleForm } from '../../users/[id]/role-form';
import { StatusToggle } from '../../users/[id]/status-toggle';
import { setCustomerDiscount } from '../../users/actions';

export interface CustomerAddress {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  street2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  label: string | null;
}

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  customerType: 'RETAIL' | 'WHOLESALE';
  personalDiscountPercent: number | null;
  avatar: string | null;
  phone: string | null;
  isActive: boolean;
  banned: boolean;
  inDb: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  counts: { reviews: number; wishlists: number };
  addresses: CustomerAddress[];
}

const PAID_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];

const statusColors = ORDER_STATUS_COLOR;

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  paid: 'bg-green-500/15 text-green-600 dark:text-green-400',
  processing: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  shipped: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  delivered: 'bg-green-500/15 text-green-600 dark:text-green-400',
  cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400',
  returned: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  refund_requested: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
};

const zl = (cents: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(cents / 100);
const orderKey = (o: Order) => ((o as unknown as { _id?: string })._id ?? o.id) as string;

export function CustomerDetailClient({ profile }: { profile: CustomerProfile }) {
  const { t } = useTranslation();
  const { getToken } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);

  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || profile.email;
  const initials =
    `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase() ||
    profile.email[0]?.toUpperCase() ||
    '?';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const token = (await getToken()) || undefined;
        const [ordersRes, tiersRes] = await Promise.all([
          api.orders.getByUser(profile.id, { limit: 200, token }),
          api.loyaltyTiers.getAll({ token }),
        ]);
        if (!cancelled) {
          setOrders(ordersRes.data || []);
          setTiers((tiersRes.data || []).filter((tr) => tr.active));
        }
      } catch {
        // Analytics are non-critical; the profile still renders.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken, profile.id]);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => PAID_STATUSES.includes(o.status));
    const totalSpent = paid.reduce((s, o) => s + o.totalAmount, 0);
    const orderCount = orders.length;
    const aov = paid.length > 0 ? Math.round(totalSpent / paid.length) : 0;
    const sorted = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const lastOrderAt = sorted[0]?.createdAt ?? null;
    const totalItems = paid.reduce((s, o) => s + (o.items?.length ?? 0), 0);
    return { totalSpent, orderCount, paidCount: paid.length, aov, lastOrderAt, totalItems };
  }, [orders]);

  // Monthly spend series (last 12 months) for the area chart.
  const spendSeries = useMemo(() => {
    const buckets = new Map<string, number>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
    }
    for (const o of orders) {
      if (!PAID_STATUSES.includes(o.status)) continue;
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + o.totalAmount);
    }
    return Array.from(buckets.entries()).map(([key, cents]) => {
      const [y, m] = key.split('-');
      return {
        month: key,
        label: new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pl-PL', {
          month: 'short',
        }),
        revenue: cents / 100,
      };
    });
  }, [orders]);

  const statusDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1;
    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      fill: statusColors[status] || CHART.blue,
    }));
  }, [orders]);

  // Effective loyalty tier from lifetime paid spend + progress to the next tier.
  const loyalty = useMemo(() => {
    const sorted = [...tiers].sort((a, b) => a.minSpendCents - b.minSpendCents);
    let current: LoyaltyTier | null = null;
    let next: LoyaltyTier | null = null;
    for (const tr of sorted) {
      if (stats.totalSpent >= tr.minSpendCents) current = tr;
      else {
        next = tr;
        break;
      }
    }
    const percent = profile.customerType === 'WHOLESALE' ? 0 : current?.percent ?? 0;
    const toNext = next ? Math.max(0, next.minSpendCents - stats.totalSpent) : 0;
    const progress = next
      ? Math.min(100, (stats.totalSpent / next.minSpendCents) * 100)
      : current
        ? 100
        : 0;
    return { current, next, percent, toNext, progress, hasTiers: sorted.length > 0 };
  }, [tiers, stats.totalSpent, profile.customerType]);

  // Manual per-customer discount editor state.
  const [discountInput, setDiscountInput] = useState(
    profile.personalDiscountPercent != null ? String(profile.personalDiscountPercent) : '',
  );
  const [savedDiscount, setSavedDiscount] = useState<number | null>(profile.personalDiscountPercent);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [discountMsg, setDiscountMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const parsedDiscount = discountInput.trim() === '' ? null : Number(discountInput);
  const discountInvalid =
    parsedDiscount !== null &&
    (Number.isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100);
  const discountDirty = !discountInvalid && (parsedDiscount ?? null) !== (savedDiscount ?? null);

  // Effective retail discount = greater of the loyalty tier and the manual
  // per-customer discount (mirrors order.service pricing). Wholesale gets neither.
  const effectivePercent =
    profile.customerType === 'WHOLESALE' ? 0 : Math.max(loyalty.percent, savedDiscount ?? 0);

  const handleSaveDiscount = async () => {
    setSavingDiscount(true);
    setDiscountMsg(null);
    try {
      const res = await setCustomerDiscount(profile.id, parsedDiscount);
      const val = res.personalDiscountPercent ?? null;
      setSavedDiscount(val);
      setDiscountInput(val != null ? String(val) : '');
      setDiscountMsg({ ok: true, text: t('customers.detail.discountSaved') });
    } catch {
      setDiscountMsg({ ok: false, text: t('customers.detail.discountError') });
    } finally {
      setSavingDiscount(false);
    }
  };

  const areaConfig: ChartConfig = {
    revenue: { label: t('customers.detail.spend'), color: CHART.blue },
  };
  const pieConfig: ChartConfig = {
    count: { label: t('customers.detail.orders') },
    ...Object.fromEntries(
      statusDist.map((d) => [d.status, { label: t(`orders.status.${d.status}`), color: d.fill }]),
    ),
  };

  const fmtDate = (iso: string | Date, opts?: Intl.DateTimeFormatOptions) =>
    new Date(iso).toLocaleDateString('pl-PL', opts ?? { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t('customers.title')}
          </Link>
          <Separator orientation="vertical" className="hidden h-5 sm:block" />
          <div className="flex items-center gap-3">
            <Avatar className="size-10 ring-1 ring-foreground/10">
              {profile.avatar ? <AvatarImage src={profile.avatar} alt={fullName} /> : null}
              <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {profile.customerType === 'WHOLESALE' ? (
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
          <Badge
            variant="secondary"
            className={
              profile.isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            }
          >
            {profile.isActive ? t('customers.status.active') : t('customers.status.inactive')}
          </Badge>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<Wallet className="size-4" />}
          label={t('customers.detail.totalSpent')}
          value={loading ? '—' : zl(stats.totalSpent)}
          hint={t('customers.detail.paidOrdersCount', { count: stats.paidCount })}
        />
        <KpiCard
          icon={<ShoppingBag className="size-4" />}
          label={t('customers.detail.orders')}
          value={loading ? '—' : String(stats.orderCount)}
          hint={t('customers.detail.itemsBought', { count: stats.totalItems })}
        />
        <KpiCard
          icon={<Receipt className="size-4" />}
          label={t('customers.detail.aov')}
          value={loading ? '—' : zl(stats.aov)}
          hint={t('customers.detail.perPaidOrder')}
        />
        <KpiCard
          icon={<Clock className="size-4" />}
          label={t('customers.detail.lastOrder')}
          value={loading ? '—' : stats.lastOrderAt ? fmtDate(stats.lastOrderAt) : '—'}
          hint={t('customers.detail.memberSinceShort', { date: fmtDate(profile.createdAt) })}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left / main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Spend over time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-4 text-muted-foreground" />
                {t('customers.detail.spendOverTime')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : stats.paidCount === 0 ? (
                <EmptyChart label={t('customers.detail.noOrders')} />
              ) : (
                <ChartContainer config={areaConfig} className="h-[260px] w-full">
                  <AreaChart data={spendSeries} margin={{ left: 4, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      tickFormatter={(v) => `${v} zł`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `${Number(value).toFixed(2)} zł`}
                        />
                      }
                    />
                    <Area
                      dataKey="revenue"
                      type="monotone"
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                      fill="url(#fillSpend)"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Status donut + Loyalty */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('customers.detail.ordersByStatus')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="mx-auto h-[220px] w-[220px] rounded-full" />
                ) : statusDist.length === 0 ? (
                  <EmptyChart label={t('customers.detail.noOrders')} />
                ) : (
                  <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[220px]">
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={statusDist}
                        dataKey="count"
                        nameKey="status"
                        innerRadius={58}
                        strokeWidth={4}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                              return (
                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-2xl font-bold"
                                  >
                                    {stats.orderCount}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 20}
                                    className="fill-muted-foreground text-xs"
                                  >
                                    {t('customers.detail.orders')}
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Loyalty & pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgePercent className="size-4 text-muted-foreground" />
                  {t('customers.detail.loyalty')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('customers.detail.effectiveDiscount')}
                    </p>
                    <p className="text-3xl font-bold leading-none tracking-tight">
                      {effectivePercent}%
                    </p>
                  </div>
                  {profile.customerType === 'WHOLESALE' ? (
                    <Badge variant="outline" className="text-amber-600 dark:text-amber-300">
                      {t('customers.detail.wholesalePricing')}
                    </Badge>
                  ) : loyalty.current ? (
                    <Badge variant="secondary">{t('customers.detail.tierReached')}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      {t('customers.detail.noTier')}
                    </Badge>
                  )}
                </div>

                {profile.customerType === 'WHOLESALE' ? (
                  <p className="text-sm text-muted-foreground">
                    {t('customers.detail.wholesaleNote')}
                  </p>
                ) : loyalty.next ? (
                  <div className="space-y-1.5">
                    <Progress value={loyalty.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {t('customers.detail.toNextTier', {
                        amount: zl(loyalty.toNext),
                        percent: loyalty.next.percent,
                      })}
                    </p>
                  </div>
                ) : loyalty.current ? (
                  <p className="text-xs text-muted-foreground">
                    {t('customers.detail.topTier')}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t('customers.detail.spendToUnlock')}
                  </p>
                )}
                <Separator />
                {profile.customerType === 'WHOLESALE' ? (
                  <p className="text-xs text-muted-foreground">{t('customers.detail.discountHint')}</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">{t('customers.detail.personalDiscount')}</p>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          inputMode="numeric"
                          value={discountInput}
                          onChange={(e) => {
                            setDiscountInput(e.target.value);
                            setDiscountMsg(null);
                          }}
                          placeholder={t('customers.detail.personalDiscountPlaceholder')}
                          aria-invalid={discountInvalid}
                          className="pr-7"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSaveDiscount}
                        disabled={savingDiscount || discountInvalid || !discountDirty}
                      >
                        {savingDiscount
                          ? t('customers.detail.savingDiscount')
                          : t('customers.detail.saveDiscount')}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('customers.detail.personalDiscountHint')}
                    </p>
                    {discountMsg && (
                      <p
                        className={cn(
                          'text-xs',
                          discountMsg.ok
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-destructive',
                        )}
                      >
                        {discountMsg.text}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent orders */}
          <Card>
            <CardHeader>
              <CardTitle>{t('customers.detail.recentOrders')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">{t('customers.detail.noOrders')}</p>
              ) : (
                <div className="divide-y">
                  {[...orders]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 8)
                    .map((o) => {
                      const id = orderKey(o);
                      return (
                        <Link
                          key={id}
                          href={`/dashboard/orders/${id}`}
                          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium">{o.orderNumber}</span>
                              <Badge
                                variant="secondary"
                                className={cn('text-[11px]', statusBadge[o.status])}
                              >
                                {t(`orders.status.${o.status}`)}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {fmtDate(String(o.createdAt), {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              · {t('orders.itemsCount', { count: o.items?.length ?? 0 })}
                            </p>
                          </div>
                          <span className="text-sm font-semibold tabular-nums">
                            {zl(o.totalAmount)}
                          </span>
                          <ExternalLink className="size-3.5 text-muted-foreground/50" />
                        </Link>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle>{t('customers.detail.addresses')}</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.addresses.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {profile.addresses.map((address) => (
                    <div key={address.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <div className="text-sm">
                            <p className="font-medium text-foreground">
                              {address.firstName} {address.lastName}
                            </p>
                            <p className="text-muted-foreground">{address.street}</p>
                            {address.street2 && <p className="text-muted-foreground">{address.street2}</p>}
                            <p className="text-muted-foreground">
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                            <p className="text-muted-foreground">{address.country}</p>
                            {address.phone && <p className="text-muted-foreground">{address.phone}</p>}
                          </div>
                        </div>
                        {address.isDefault && (
                          <Badge variant="secondary">{t('customers.detail.default')}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('customers.detail.noAddresses')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('customers.detail.profile')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={Mail} label={t('customers.detail.email')}>
                <a href={`mailto:${profile.email}`} className="text-primary hover:underline">
                  {profile.email}
                </a>
              </InfoRow>
              {profile.phone && (
                <InfoRow icon={Phone} label={t('customers.detail.phone')}>
                  {profile.phone}
                </InfoRow>
              )}
              <InfoRow icon={CalendarDays} label={t('customers.detail.memberSince')}>
                {fmtDate(profile.createdAt, { year: 'numeric', month: 'long', day: 'numeric' })}
              </InfoRow>
              {profile.lastLoginAt && (
                <InfoRow icon={Clock} label={t('customers.detail.lastLogin')}>
                  {fmtDate(profile.lastLoginAt)}
                </InfoRow>
              )}
              <Separator />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">{t('customers.detail.customerId')}:</span>
                <CopyId value={profile.id} truncate className="max-w-[200px]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('customers.detail.activity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <StatBlock icon={MapPin} value={profile.addresses.length} label={t('customers.detail.addresses')} />
                <StatBlock icon={Star} value={profile.counts.reviews} label={t('customers.detail.reviews')} />
                <StatBlock icon={Heart} value={profile.counts.wishlists} label={t('customers.detail.wishlists')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('customers.detail.roleManagement')}</CardTitle>
            </CardHeader>
            <CardContent>
              <RoleForm userId={profile.id} currentRole={profile.role} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('customers.detail.accountControl')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusToggle userId={profile.id} isActive={profile.isActive} isBanned={profile.banned} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
        <span className="flex size-8 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
          {icon}
        </span>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-xl font-semibold leading-none tracking-tight tabular-nums sm:text-2xl">
          {value}
        </div>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-foreground">{children}</div>
      </div>
    </div>
  );
}

function StatBlock({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
      <Icon className="size-4 text-muted-foreground" />
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
