'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { ShippingZone } from '@repo/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { DataTableFilters, type FilterConfig } from '@/components/DataTableFilters';
import { AnalyticsPanel, StatCard } from '@/components/AnalyticsPanel';
import { Eye, Pencil, Trash2, MapPin, CheckCircle, Truck } from 'lucide-react';
import { ZoneSheet } from './zone-sheet';

const zoneFilterConfigs: FilterConfig[] = [
  { key: 'search', label: 'Search', type: 'search', placeholder: 'Search zones...' },
];

export default function ShippingZonesPage() {
  const { getToken } = useAuth();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({ search: '' });

  const filteredZones = useMemo(() => {
    const search = (filterValues.search as string || '').toLowerCase();
    if (!search) return zones;
    return zones.filter((z) => z.name.toLowerCase().includes(search));
  }, [zones, filterValues.search]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await api.shipping.zones.getAll(token || undefined);
      if (response.success && response.data) {
        setZones(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    try {
      const token = await getToken();
      await api.shipping.zones.delete(id, token || undefined);
      await fetchZones();
    } catch (err: any) {
      setError(err.message || 'Failed to delete zone');
    }
  };

  const handleEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setSheetOpen(true);
  };

  const handleFormSuccess = () => {
    setSheetOpen(false);
    setEditingZone(null);
    fetchZones();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading zones...</div>
      </div>
    );
  }

  const activeZones = zones.filter((z) => z.isActive).length;
  const freeShippingZones = zones.filter((z) => z.freeShippingThreshold).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shipping Zones</h1>
        <Button onClick={() => { setEditingZone(null); setSheetOpen(true); }}>
          Create Zone
        </Button>
      </div>

      {/* Analytics */}
      {zones.length > 0 && (
        <AnalyticsPanel title="Shipping Analytics">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total Zones" value={zones.length} icon={<MapPin className="h-4 w-4 text-blue-600" />} color="bg-blue-50" />
            <StatCard label="Active Zones" value={activeZones} icon={<CheckCircle className="h-4 w-4 text-green-600" />} color="bg-green-50" subtitle={`${zones.length > 0 ? Math.round((activeZones / zones.length) * 100) : 0}%`} />
            <StatCard label="Free Shipping" value={freeShippingZones} icon={<Truck className="h-4 w-4 text-purple-600" />} color="bg-purple-50" subtitle={`${zones.length > 0 ? Math.round((freeShippingZones / zones.length) * 100) : 0}% of zones`} />
          </div>
        </AnalyticsPanel>
      )}

      <DataTableFilters
        filters={zoneFilterConfigs}
        values={filterValues}
        onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
        onReset={() => setFilterValues({ search: '' })}
      />

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {filteredZones.length === 0 && !loading ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No shipping zones configured. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone Name</TableHead>
                <TableHead>Countries</TableHead>
                <TableHead>States</TableHead>
                <TableHead>Free Shipping</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredZones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium text-foreground">
                    {zone.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {zone.countries.join(', ')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {zone.states.length > 0 ? `${zone.states.length} states` : 'All'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {zone.freeShippingThreshold
                      ? `$${(zone.freeShippingThreshold / 100).toFixed(2)}`
                      : 'None'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DataTableRowActions actions={[
                      { label: 'View', href: `/dashboard/shipping/zones/${zone.id}`, icon: <Eye className="h-4 w-4" /> },
                      { label: 'Edit', onClick: () => handleEdit(zone), icon: <Pencil className="h-4 w-4" /> },
                      { label: 'Delete', onClick: () => handleDelete(zone.id, zone.name), variant: 'destructive', icon: <Trash2 className="h-4 w-4" />, confirm: `Are you sure you want to delete zone "${zone.name}"?` },
                    ]} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ZoneSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        zone={editingZone}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
