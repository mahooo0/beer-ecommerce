'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableFilters } from '@/components/DataTableFilters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StockMovement {
  id: string;
  createdAt: string;
  productName?: string;
  sku?: string;
  warehouseName?: string;
  quantity: number;
  reason: string;
  reference?: string;
  note?: string;
}

const REASON_OPTIONS = [
  { value: '', label: 'All Reasons' },
  { value: 'SALE', label: 'Sale' },
  { value: 'RETURN', label: 'Return' },
  { value: 'MANUAL_ADJUSTMENT', label: 'Manual Adjustment' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'RESTOCK', label: 'Restock' },
  { value: 'RESERVATION', label: 'Reservation' },
  { value: 'RESERVATION_RELEASE', label: 'Reservation Release' },
];

const REASON_BADGE_COLORS: Record<string, string> = {
  SALE: 'bg-blue-100 text-blue-800',
  RETURN: 'bg-green-100 text-green-800',
  MANUAL_ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
  DAMAGE: 'bg-red-100 text-red-800',
  RESTOCK: 'bg-purple-100 text-purple-800',
  RESERVATION: 'bg-gray-100 text-gray-800',
  RESERVATION_RELEASE: 'bg-gray-100 text-gray-600',
};

export default function MovementsPage() {
  const { getToken } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasonFilter, setReasonFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await api.inventory.movements.getAll({
        reason: reasonFilter || undefined,
        search: searchQuery || undefined,
        dateFrom: dateRange.from || undefined,
        dateTo: dateRange.to || undefined,
        page,
        limit,
        token: token || undefined,
      });
      if (response.success && response.data) {
        setMovements(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [reasonFilter, searchQuery, dateRange, page]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock Movement History</h1>
      </div>

      <DataTableFilters
        filters={[
          {
            key: 'search',
            label: 'Search',
            type: 'search',
            placeholder: 'Search by product or SKU...',
          },
          {
            key: 'reason',
            label: 'Reason',
            type: 'select',
            placeholder: 'All Reasons',
            options: REASON_OPTIONS.filter(o => o.value !== '').map(o => ({ value: o.value, label: o.label })),
          },
          {
            key: 'date',
            label: 'Date Range',
            type: 'date-range',
            placeholder: 'Filter by date...',
          },
        ]}
        values={{ search: searchQuery, reason: reasonFilter, date: dateRange }}
        onChange={(key, value) => {
          if (key === 'reason') {
            setReasonFilter(value as string);
            setPage(1);
          }
          if (key === 'search') {
            setSearchQuery(value as string);
            setPage(1);
          }
          if (key === 'date') {
            setDateRange(value as { from?: string; to?: string });
            setPage(1);
          }
        }}
        onReset={() => {
          setReasonFilter('');
          setSearchQuery('');
          setDateRange({});
          setPage(1);
        }}
      />

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="text-muted-foreground">Loading movements...</div>
        </div>
      ) : movements.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">No stock movements found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product / SKU</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(movement.createdAt)}
                  </TableCell>
                  <TableCell className="text-foreground">
                    <div className="font-medium">{movement.productName ?? '—'}</div>
                    {movement.sku && (
                      <div className="font-mono text-xs text-muted-foreground">{movement.sku}</div>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {movement.warehouseName ?? '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-semibold">
                    <span
                      className={movement.quantity >= 0 ? 'text-green-600' : 'text-red-600'}
                    >
                      {movement.quantity >= 0 ? '+' : ''}{movement.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge
                      variant="secondary"
                      className={`${REASON_BADGE_COLORS[movement.reason] ?? 'bg-gray-100 text-gray-800'} hover:opacity-90`}
                    >
                      {movement.reason.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {movement.reference ?? '—'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {movement.note ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} &bull; Showing {movements.length} movements
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={movements.length < limit}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
