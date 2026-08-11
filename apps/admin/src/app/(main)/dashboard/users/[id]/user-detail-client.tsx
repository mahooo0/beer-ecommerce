'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, Phone, CalendarDays, Clock, MapPin, Star, Heart, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CopyId } from '../copy-id';
import { RoleForm } from './role-form';
import { StatusToggle } from './status-toggle';

export interface UserDetailAddress {
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

export interface UserDetailData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  avatar: string | null;
  phone: string | null;
  isActive: boolean;
  banned: boolean;
  inDb: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  counts: { reviews: number; wishlists: number };
  addresses: UserDetailAddress[];
}

const roleBadgeClass: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300',
  ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  CUSTOMER: 'bg-muted text-muted-foreground',
};

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
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-foreground">{children}</div>
      </div>
    </div>
  );
}

export function UserDetailClient({ user }: { user: UserDetailData }) {
  const { t } = useTranslation();
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || '—';

  const formatDate = (iso: string, withMonthName = false) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: withMonthName ? 'long' : '2-digit',
      day: '2-digit',
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/users"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('users.title')}
          </Link>
          <Separator orientation="vertical" className="hidden h-5 sm:block" />
          <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={roleBadgeClass[user.role] ?? roleBadgeClass.CUSTOMER}>
            {t(`users.roles.${user.role}`)}
          </Badge>
          <Badge
            variant="secondary"
            className={
              user.isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            }
          >
            {user.isActive ? t('users.status.active') : t('users.status.disabled')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — main info */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('users.detail.userInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-start gap-6">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="h-20 w-20 rounded-full object-cover ring-1 ring-foreground/10"
                    src={user.avatar}
                    alt={fullName}
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{fullName}</h2>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t('users.detail.userId')}:</span>
                    <CopyId value={user.id} truncate className="max-w-[260px]" />
                    <Badge variant="outline" className="gap-1">
                      <Database className="h-3 w-3" />
                      {user.inDb ? t('users.detail.inDatabase') : t('users.detail.clerkOnly')}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow icon={Mail} label={t('users.detail.email')}>
                  <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                    {user.email}
                  </a>
                </InfoRow>
                {user.phone && (
                  <InfoRow icon={Phone} label={t('users.detail.phone')}>
                    {user.phone}
                  </InfoRow>
                )}
                <InfoRow icon={CalendarDays} label={t('users.detail.memberSince')}>
                  {formatDate(user.createdAt, true)}
                </InfoRow>
                {user.lastLoginAt && (
                  <InfoRow icon={Clock} label={t('users.detail.lastLogin')}>
                    {formatDate(user.lastLoginAt)}
                  </InfoRow>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle>{t('users.detail.addresses')}</CardTitle>
            </CardHeader>
            <CardContent>
              {user.addresses.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {user.addresses.map((address) => (
                    <div key={address.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="text-sm">
                            <p className="font-medium text-foreground">
                              {address.firstName} {address.lastName}
                            </p>
                            <p className="text-muted-foreground">{address.street}</p>
                            {address.street2 && (
                              <p className="text-muted-foreground">{address.street2}</p>
                            )}
                            <p className="text-muted-foreground">
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                            <p className="text-muted-foreground">{address.country}</p>
                            {address.phone && (
                              <p className="text-muted-foreground">{address.phone}</p>
                            )}
                          </div>
                        </div>
                        {address.isDefault && (
                          <Badge variant="secondary">{t('users.detail.default')}</Badge>
                        )}
                      </div>
                      {address.label && (
                        <p className="mt-2 text-xs text-muted-foreground">{address.label}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('users.detail.noAddresses')}</p>
              )}
            </CardContent>
          </Card>

          {/* Activity statistics */}
          <Card>
            <CardHeader>
              <CardTitle>{t('users.detail.activityStatistics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <StatBlock icon={MapPin} value={user.addresses.length} label={t('users.detail.addresses')} />
                <StatBlock icon={Star} value={user.counts.reviews} label={t('users.detail.reviews')} />
                <StatBlock icon={Heart} value={user.counts.wishlists} label={t('users.detail.wishlists')} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column — actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('users.detail.roleManagement')}</CardTitle>
            </CardHeader>
            <CardContent>
              <RoleForm userId={user.id} currentRole={user.role} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('users.detail.accountControl')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusToggle userId={user.id} isActive={user.isActive} isBanned={user.banned} />
            </CardContent>
          </Card>
        </div>
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
    <div className="flex flex-col items-center gap-1 rounded-lg border p-4 text-center">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
