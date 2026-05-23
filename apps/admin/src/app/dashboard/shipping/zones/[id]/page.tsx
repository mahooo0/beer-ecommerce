'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { MethodSheet } from './method-sheet';
import type { ShippingZone, ShippingMethod } from '@repo/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

export default function ZoneDetailPage() {
  const { id: zoneId } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();

  const [zone, setZone] = useState<(ShippingZone & { methods: ShippingMethod[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMethodForm, setShowMethodForm] = useState(false);
  const [editingZone, setEditingZone] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneThreshold, setZoneThreshold] = useState('');
  const [zoneActive, setZoneActive] = useState(true);

  const fetchZone = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await api.shipping.zones.getById(zoneId, token || undefined);
      if (response.success && response.data) {
        setZone(response.data);
        setZoneName(response.data.name);
        setZoneThreshold(
          response.data.freeShippingThreshold
            ? (response.data.freeShippingThreshold / 100).toFixed(2)
            : ''
        );
        setZoneActive(response.data.isActive);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch zone');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZone();
  }, [zoneId]);

  const handleUpdateZone = async () => {
    if (!zone) return;

    try {
      const token = await getToken();
      const data: any = {
        name: zoneName.trim(),
        isActive: zoneActive,
      };

      if (zoneThreshold) {
        const threshold = parseFloat(zoneThreshold);
        if (isNaN(threshold) || threshold < 0) {
          setError('Free shipping threshold must be a valid positive number');
          return;
        }
        data.freeShippingThreshold = Math.round(threshold * 100);
      } else {
        data.freeShippingThreshold = null;
      }

      await api.shipping.zones.update(zoneId, data, token || undefined);
      await fetchZone();
      setEditingZone(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update zone');
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      const token = await getToken();
      await api.shipping.methods.delete(methodId, token || undefined);
      await fetchZone();
    } catch (err: any) {
      setError(err.message || 'Failed to delete method');
    }
  };

  const handleMethodSuccess = () => {
    setShowMethodForm(false);
    fetchZone();
  };

  const getRateTypeBadgeColor = (rateType: string) => {
    switch (rateType) {
      case 'FLAT_RATE': return 'bg-blue-100 text-blue-800';
      case 'WEIGHT_BASED': return 'bg-green-100 text-green-800';
      case 'PRICE_BASED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRateDetails = (method: ShippingMethod) => {
    switch (method.rateType) {
      case 'FLAT_RATE':
        return method.flatRate ? `$${(method.flatRate / 100).toFixed(2)}` : 'N/A';
      case 'WEIGHT_BASED':
        const rate = method.weightRate ? `$${(method.weightRate / 100).toFixed(2)}/kg` : 'N/A';
        const limits = [];
        if (method.minWeight) limits.push(`min ${method.minWeight}kg`);
        if (method.maxWeight) limits.push(`max ${method.maxWeight}kg`);
        return limits.length > 0 ? `${rate} (${limits.join(', ')})` : rate;
      case 'PRICE_BASED':
        if (!method.priceThresholds) return 'No tiers';
        const thresholds = Array.isArray(method.priceThresholds)
          ? method.priceThresholds
          : Object.values(method.priceThresholds);
        return `${thresholds.length} tiers`;
      default:
        return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading zone...</div>
      </div>
    );
  }

  if (error && !zone) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error || 'Zone not found'}
        </div>
        <Button variant="ghost" onClick={() => router.push('/dashboard/shipping/zones')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to zones
        </Button>
      </div>
    );
  }

  if (!zone) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/shipping/zones')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Zone: {zone.name}</h1>
        <Badge variant="secondary">
          {zone.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {/* Zone Info Card */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Zone Information</h2>
          {!editingZone ? (
            <Button variant="outline" size="sm" onClick={() => setEditingZone(true)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdateZone}>Save</Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingZone(false);
                  setZoneName(zone.name);
                  setZoneThreshold(
                    zone.freeShippingThreshold
                      ? (zone.freeShippingThreshold / 100).toFixed(2)
                      : ''
                  );
                  setZoneActive(zone.isActive);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Zone Name</label>
            {editingZone ? (
              <Input
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-foreground">{zone.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">Countries</label>
            <p className="mt-1 text-foreground">{zone.countries.join(', ')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">States/Provinces</label>
            <p className="mt-1 text-foreground">
              {zone.states.length > 0 ? zone.states.join(', ') : 'All'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              Free Shipping Threshold
            </label>
            {editingZone ? (
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-muted-foreground">$</span>
                </div>
                <Input
                  type="number"
                  value={zoneThreshold}
                  onChange={(e) => setZoneThreshold(e.target.value)}
                  step="0.01"
                  min="0"
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            ) : (
              <p className="mt-1 text-foreground">
                {zone.freeShippingThreshold
                  ? `$${(zone.freeShippingThreshold / 100).toFixed(2)}`
                  : 'None'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">Status</label>
            {editingZone ? (
              <div className="mt-1 flex items-center">
                <input
                  type="checkbox"
                  checked={zoneActive}
                  onChange={(e) => setZoneActive(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="ml-2 text-sm text-foreground">Active</span>
              </div>
            ) : (
              <Badge variant="secondary" className="mt-1">
                {zone.isActive ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Methods */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Shipping Methods</h2>
          <Button
            size="sm"
            onClick={() => setShowMethodForm(true)}
          >
            Add Method
          </Button>
        </div>

        <MethodSheet
          open={showMethodForm}
          onOpenChange={setShowMethodForm}
          zoneId={zoneId}
          onSuccess={handleMethodSuccess}
        />

        {zone.methods.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              No shipping methods configured. Add one to get started.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rate Type</TableHead>
                <TableHead>Rate Details</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zone.methods
                .sort((a, b) => a.position - b.position)
                .map((method) => (
                  <TableRow key={method.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{method.name}</div>
                      {method.description && (
                        <div className="text-sm text-muted-foreground">{method.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getRateTypeBadgeColor(method.rateType)}>
                        {method.rateType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRateDetails(method)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {method.estimatedDaysMin && method.estimatedDaysMax
                        ? `${method.estimatedDaysMin}-${method.estimatedDaysMax} days`
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {method.position}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {method.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DataTableRowActions actions={[
                        {
                          label: 'Delete',
                          onClick: () => handleDeleteMethod(method.id),
                          variant: 'destructive',
                          icon: <Trash2 className="h-4 w-4" />,
                          confirm: `Delete method "${method.name}"?`,
                        },
                      ]} />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
