'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

const ADJUSTMENT_REASONS = [
  { value: 'MANUAL_ADJUSTMENT', label: 'Manual Adjustment' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'RESTOCK', label: 'Restock' },
  { value: 'RETURN', label: 'Return' },
];

export default function AdjustmentsPage() {
  const { getToken } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [formData, setFormData] = useState({
    variantId: '',
    warehouseId: '',
    quantity: '',
    reason: 'MANUAL_ADJUSTMENT',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const token = await getToken();
        const response = await api.inventory.warehouses.getAll(token || undefined);
        if (response.success && response.data) {
          setWarehouses(response.data.filter((w: Warehouse) => w.isActive));
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load warehouses');
      } finally {
        setLoadingWarehouses(false);
      }
    };
    fetchWarehouses();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!formData.variantId.trim()) {
      setErrorMessage('Variant ID is required');
      return;
    }
    if (!formData.warehouseId) {
      setErrorMessage('Warehouse is required');
      return;
    }
    if (!formData.quantity || isNaN(Number(formData.quantity))) {
      setErrorMessage('A valid quantity is required');
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      await api.inventory.stock.adjust({
        variantId: formData.variantId.trim(),
        warehouseId: formData.warehouseId,
        quantity: Number(formData.quantity),
        reason: formData.reason,
        note: formData.note.trim() || undefined,
      }, token || undefined);
      setSuccessMessage('Stock adjusted successfully.');
      setFormData({
        variantId: '',
        warehouseId: '',
        quantity: '',
        reason: 'MANUAL_ADJUSTMENT',
        note: '',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manual Stock Adjustment</h1>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          Positive quantity adds stock, negative removes stock (e.g., -5 removes 5 units).
        </div>

        {successMessage && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>
              Variant ID <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              name="variantId"
              value={formData.variantId}
              onChange={handleChange}
              className="mt-1"
              placeholder="Enter variant ID"
            />
          </div>

          <div>
            <Label>
              Warehouse <span className="text-red-500">*</span>
            </Label>
            {loadingWarehouses ? (
              <p className="mt-1 text-sm text-muted-foreground">Loading warehouses...</p>
            ) : (
              <Select value={formData.warehouseId} onValueChange={(v) => setFormData(prev => ({ ...prev, warehouseId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a warehouse" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="mt-1"
              placeholder="e.g., 10 or -5"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use a positive number to add stock, negative to remove.
            </p>
          </div>

          <div>
            <Label>
              Reason <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.reason} onValueChange={(v) => setFormData(prev => ({ ...prev, reason: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              Note (optional)
            </Label>
            <Textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={3}
              className="mt-1"
              placeholder="Optional note about this adjustment"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting || loadingWarehouses}
            >
              {submitting ? 'Adjusting...' : 'Apply Adjustment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
