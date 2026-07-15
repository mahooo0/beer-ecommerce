'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddTrackingFormProps {
  orderId: string;
  onSuccess: () => void;
}

export default function AddTrackingForm({ orderId, onSuccess }: AddTrackingFormProps) {
  const { getToken } = useAuth();
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = await getToken();
      const data: { carrier: string; trackingNumber: string; estimatedDelivery?: string } = {
        carrier,
        trackingNumber,
      };

      if (estimatedDelivery) {
        data.estimatedDelivery = estimatedDelivery;
      }

      await api.orders.addTracking(orderId, data, token || undefined);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tracking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-6 bg-card shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Add Tracking Information</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="carrier" className="block text-sm font-medium text-foreground mb-1">
            Carrier <span className="text-red-500">*</span>
          </label>
          <Select value={carrier} onValueChange={setCarrier}>
            <SelectTrigger>
              <SelectValue placeholder="Select a carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USPS">USPS</SelectItem>
              <SelectItem value="FedEx">FedEx</SelectItem>
              <SelectItem value="UPS">UPS</SelectItem>
              <SelectItem value="DHL">DHL</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="trackingNumber" className="block text-sm font-medium text-foreground mb-1">
            Tracking Number <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            id="trackingNumber"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            disabled={!carrier}
            placeholder={carrier ? 'Enter tracking number' : 'Select a carrier first'}
          />
        </div>

        <div>
          <label htmlFor="estimatedDelivery" className="block text-sm font-medium text-foreground mb-1">
            Estimated Delivery Date
          </label>
          <Input
            type="date"
            id="estimatedDelivery"
            value={estimatedDelivery}
            onChange={(e) => setEstimatedDelivery(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !carrier || !trackingNumber}
          className="w-full"
        >
          {loading ? 'Submitting...' : 'Mark as Shipped'}
        </Button>
      </div>
    </form>
  );
}
