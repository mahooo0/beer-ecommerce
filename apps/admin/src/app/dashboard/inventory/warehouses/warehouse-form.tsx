'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface WarehouseFormProps {
  warehouse?: any;
  onSave: () => void;
  onCancel: () => void;
}

export function WarehouseForm({ warehouse, onSave, onCancel }: WarehouseFormProps) {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    name: warehouse?.name ?? '',
    code: warehouse?.code ?? '',
    address: warehouse?.address ?? '',
    city: warehouse?.city ?? '',
    state: warehouse?.state ?? '',
    country: warehouse?.country ?? '',
    zipCode: warehouse?.zipCode ?? '',
    latitude: warehouse?.latitude ?? '',
    longitude: warehouse?.longitude ?? '',
    priority: warehouse?.priority ?? 1,
    isActive: warehouse?.isActive ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.code.trim()) {
      setError('Code is required');
      return;
    }

    const payload = {
      ...formData,
      code: formData.code.toUpperCase(),
      latitude: formData.latitude !== '' ? Number(formData.latitude) : undefined,
      longitude: formData.longitude !== '' ? Number(formData.longitude) : undefined,
      priority: Number(formData.priority),
    };

    try {
      setSubmitting(true);
      const token = await getToken();
      if (warehouse?.id) {
        await api.inventory.warehouses.update(warehouse.id, payload, token || undefined);
      } else {
        await api.inventory.warehouses.create(payload, token || undefined);
      }
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1"
            placeholder="Main Warehouse"
          />
        </div>

        <div>
          <Label>
            Code <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="mt-1 uppercase"
            placeholder="WH-MAIN"
          />
        </div>

        <div className="sm:col-span-2">
          <Label>Address</Label>
          <Input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="mt-1"
            placeholder="123 Warehouse St"
          />
        </div>

        <div>
          <Label>City</Label>
          <Input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="mt-1"
          />
        </div>

        <div>
          <Label>State</Label>
          <Input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="mt-1"
          />
        </div>

        <div>
          <Label>
            Country (2-char)
          </Label>
          <Input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            maxLength={2}
            className="mt-1 uppercase"
            placeholder="US"
          />
        </div>

        <div>
          <Label>Zip Code</Label>
          <Input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            className="mt-1"
          />
        </div>

        <div>
          <Label>
            Latitude (optional)
          </Label>
          <Input
            type="number"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            step="any"
            className="mt-1"
          />
        </div>

        <div>
          <Label>
            Longitude (optional)
          </Label>
          <Input
            type="number"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            step="any"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Priority</Label>
          <Input
            type="number"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            min={1}
            className="mt-1"
          />
        </div>

        <div className="flex items-center space-x-2 sm:col-span-2">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
          />
          <Label htmlFor="isActive" className="text-sm">
            Active
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : warehouse?.id ? 'Update Warehouse' : 'Create Warehouse'}
        </Button>
      </div>
    </form>
  );
}
