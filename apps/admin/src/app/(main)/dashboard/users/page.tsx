'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { hasPermission, PERMISSIONS } from '@repo/types/rbac';
import { CreateUserButton } from './create-user-button';
import { CopyId } from './copy-id';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { DataTableFilters, type FilterConfig } from '@/components/DataTableFilters';
import { AnalyticsPanel, StatCard, MiniBar } from '@/components/AnalyticsPanel';
import { Eye, Users, UserCheck, UserX, Shield } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  avatar?: string;
  createdAt: string;
}

const getUserFilterConfigs = (t: (key: string) => string): FilterConfig[] => [
  { key: 'search', label: t('users.filters.search'), type: 'search', placeholder: t('users.filters.searchPlaceholder') },
  {
    key: 'role',
    label: t('users.filters.role'),
    type: 'select',
    placeholder: t('users.filters.allRoles'),
    options: [
      { value: 'ADMIN', label: t('users.roles.ADMIN') },
      { value: 'SUPER_ADMIN', label: t('users.roles.SUPER_ADMIN') },
    ],
  },
];

export default function UsersPage() {
  const { t } = useTranslation();
  const userFilterConfigs = useMemo(() => getUserFilterConfigs(t), [t]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const canManageUsers = hasPermission(
    user?.publicMetadata?.role as string | undefined,
    PERMISSIONS.USERS_MANAGE
  );
  const page = Number(searchParams.get('page')) || 1;

  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    search: '',
    role: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const qp = new URLSearchParams();
      // Team = staff only, and admins are few — load one wide page and split
      // out customers client-side (they live on /dashboard/customers now).
      qp.set('page', '1');
      qp.set('limit', '200');
      if (filterValues.search) qp.set('search', filterValues.search);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${API_URL}/auth/users?${qp.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      const staff = (data.data || []).filter((u: User) => u.role !== 'CUSTOMER');
      setUsers(staff);
      setTotalPages(1);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [page, filterValues]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Client-side filtering as fallback if server doesn't support search/role params
  const filteredUsers = useMemo(() => {
    let result = users;
    const search = (filterValues.search as string || '').toLowerCase();
    if (search) {
      result = result.filter(
        (u) =>
          u.firstName.toLowerCase().includes(search) ||
          u.lastName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
      );
    }
    const role = filterValues.role as string;
    if (role) {
      result = result.filter((u) => u.role === role);
    }
    return result;
  }, [users, filterValues]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
      : 'bg-destructive/10 text-destructive';
  };

  const userStats = useMemo(() => {
    const byRole: Record<string, number> = {};
    let activeCount = 0;
    let inactiveCount = 0;
    users.forEach((u) => {
      byRole[u.role] = (byRole[u.role] || 0) + 1;
      if (u.isActive) activeCount++;
      else inactiveCount++;
    });
    return { byRole, activeCount, inactiveCount };
  }, [users]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('users.teamTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('users.teamSubtitle')}</p>
        </div>
        {canManageUsers && <CreateUserButton onCreated={fetchUsers} />}
      </div>

      {/* Analytics */}
      {!loading && users.length > 0 && (
        <AnalyticsPanel title={t('users.analytics.title')}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label={t('users.analytics.totalUsers')} value={users.length} icon={<Users className="h-4 w-4" />} tone="blue" />
            <StatCard label={t('users.analytics.active')} value={userStats.activeCount} icon={<UserCheck className="h-4 w-4" />} tone="emerald" />
            <StatCard label={t('users.analytics.inactive')} value={userStats.inactiveCount} icon={<UserX className="h-4 w-4" />} tone="rose" />
            <StatCard label={t('users.analytics.admins')} value={(userStats.byRole['ADMIN'] || 0) + (userStats.byRole['SUPER_ADMIN'] || 0)} icon={<Shield className="h-4 w-4" />} tone="violet" />
          </div>
          <div className="space-y-2">
            {Object.entries(userStats.byRole).map(([role, count]) => (
              <MiniBar key={role} label={t(`users.roles.${role}`)} value={count} max={users.length} color={role === 'SUPER_ADMIN' ? 'bg-purple-500' : role === 'ADMIN' ? 'bg-blue-500' : 'bg-gray-400'} />
            ))}
          </div>
        </AnalyticsPanel>
      )}

      <DataTableFilters
        filters={userFilterConfigs}
        values={filterValues}
        onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
        onReset={() => setFilterValues({ search: '', role: '' })}
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('users.columns.user')}</TableHead>
              <TableHead>{t('users.columns.id')}</TableHead>
              <TableHead>{t('users.columns.email')}</TableHead>
              <TableHead>{t('users.columns.role')}</TableHead>
              <TableHead>{t('users.columns.status')}</TableHead>
              <TableHead>{t('users.columns.created')}</TableHead>
              <TableHead className="text-right">{t('users.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <div className="h-12 animate-pulse bg-muted rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {user.avatar ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <CopyId value={user.id} truncate className="max-w-[150px]" />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="secondary" className={getRoleBadgeColor(user.role)}>
                      {t(`users.roles.${user.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="secondary" className={getStatusBadgeColor(user.isActive)}>
                      {user.isActive ? t('users.status.active') : t('users.status.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <DataTableRowActions actions={[
                      { label: t('users.actions.view'), href: `/dashboard/users/${user.id}`, icon: <Eye className="h-4 w-4" /> },
                    ]} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">{t('users.empty')}</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => router.push(`/dashboard/users?page=${page - 1}`)}
          >
            {t('users.pagination.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('users.pagination.pageOf', { page, totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => router.push(`/dashboard/users?page=${page + 1}`)}
          >
            {t('users.pagination.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
