'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
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

const userFilterConfigs: FilterConfig[] = [
  { key: 'search', label: 'Search', type: 'search', placeholder: 'Search users...' },
  {
    key: 'role',
    label: 'Role',
    type: 'select',
    placeholder: 'All Roles',
    options: [
      { value: 'CUSTOMER', label: 'Customer' },
      { value: 'ADMIN', label: 'Admin' },
      { value: 'SUPER_ADMIN', label: 'Super Admin' },
    ],
  },
];

export default function UsersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getToken } = useAuth();
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
      qp.set('page', String(page));
      qp.set('limit', '20');
      if (filterValues.search) qp.set('search', filterValues.search);
      if (filterValues.role) qp.set('role', filterValues.role);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${API_URL}/auth/users?${qp.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      setUsers(data.data || []);
      setTotalPages(data.totalPages || 1);
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
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
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
        <h1 className="text-2xl font-bold">Users</h1>
      </div>

      {/* Analytics */}
      {!loading && users.length > 0 && (
        <AnalyticsPanel title="User Analytics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Total Users" value={users.length} icon={<Users className="h-4 w-4 text-blue-600" />} color="bg-blue-50" />
            <StatCard label="Active" value={userStats.activeCount} icon={<UserCheck className="h-4 w-4 text-green-600" />} color="bg-green-50" />
            <StatCard label="Inactive" value={userStats.inactiveCount} icon={<UserX className="h-4 w-4 text-red-600" />} color="bg-red-50" />
            <StatCard label="Admins" value={(userStats.byRole['ADMIN'] || 0) + (userStats.byRole['SUPER_ADMIN'] || 0)} icon={<Shield className="h-4 w-4 text-purple-600" />} color="bg-purple-50" />
          </div>
          <div className="space-y-2">
            {Object.entries(userStats.byRole).map(([role, count]) => (
              <MiniBar key={role} label={role} value={count} max={users.length} color={role === 'SUPER_ADMIN' ? 'bg-purple-500' : role === 'ADMIN' ? 'bg-blue-500' : 'bg-gray-400'} />
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
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
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
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="secondary" className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="secondary" className={getStatusBadgeColor(user.isActive)}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <DataTableRowActions actions={[
                      { label: 'View', href: `/dashboard/users/${user.id}`, icon: <Eye className="h-4 w-4" /> },
                    ]} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No users found.</div>
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
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => router.push(`/dashboard/users?page=${page + 1}`)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
