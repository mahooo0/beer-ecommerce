'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { DataTableFilters, type FilterConfig } from '@/components/DataTableFilters';
import { Pencil, Power, PowerOff } from 'lucide-react';
import { WarehouseSheet } from './warehouse-sheet';

const warehouseFilterConfigs: FilterConfig[] = [
  { key: 'search', label: 'Search', type: 'search', placeholder: 'Search warehouses...' },
];

interface Warehouse {
  id: string;
  name: string;
  code: string;
  city?: string;
  state?: string;
  country?: string;
  priority: number;
  isActive: boolean;
}

export default function WarehousesPage() {
  const { getToken } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({ search: '' });

  const filteredWarehouses = useMemo(() => {
    const search = (filterValues.search as string || '').toLowerCase();
    if (!search) return warehouses;
    return warehouses.filter(
      (w) => w.name.toLowerCase().includes(search) || w.code.toLowerCase().includes(search)
    );
  }, [warehouses, filterValues.search]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await api.inventory.warehouses.getAll(token || undefined);
      if (response.success && response.data) {
        setWarehouses(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleToggleActive = async (warehouse: Warehouse) => {
    const action = warehouse.isActive ? 'deactivate' : 'activate';
    try {
      const token = await getToken();
      if (warehouse.isActive) {
        await api.inventory.warehouses.delete(warehouse.id, token || undefined);
      } else {
        await api.inventory.warehouses.update(warehouse.id, { isActive: true }, token || undefined);
      }
      await fetchWarehouses();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} warehouse`);
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setSheetOpen(true);
  };

  const handleFormSave = () => {
    setSheetOpen(false);
    setEditingWarehouse(null);
    fetchWarehouses();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading warehouses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Warehouses</h1>
        <Button onClick={() => { setEditingWarehouse(null); setSheetOpen(true); }}>
          Add Warehouse
        </Button>
      </div>

      <DataTableFilters
        filters={warehouseFilterConfigs}
        values={filterValues}
        onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
        onReset={() => setFilterValues({ search: '' })}
      />

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {filteredWarehouses.length === 0 && !loading ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No warehouses configured. Add one to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>City / State</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWarehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium text-foreground">
                    {warehouse.name}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {warehouse.code}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {[warehouse.city, warehouse.state].filter(Boolean).join(', ') || '—'}
                  </TableCell>
                  <TableCell className="uppercase text-muted-foreground">
                    {warehouse.country || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {warehouse.priority}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        warehouse.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                      }
                    >
                      {warehouse.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DataTableRowActions actions={[
                      { label: 'Edit', onClick: () => handleEdit(warehouse), icon: <Pencil className="h-4 w-4" /> },
                      warehouse.isActive
                        ? { label: 'Deactivate', onClick: () => handleToggleActive(warehouse), variant: 'destructive' as const, icon: <PowerOff className="h-4 w-4" />, confirm: `Are you sure you want to deactivate "${warehouse.name}"?` }
                        : { label: 'Activate', onClick: () => handleToggleActive(warehouse), icon: <Power className="h-4 w-4" />, confirm: `Are you sure you want to activate "${warehouse.name}"?` },
                    ]} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <WarehouseSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        warehouse={editingWarehouse}
        onSuccess={handleFormSave}
      />
    </div>
  );
}
