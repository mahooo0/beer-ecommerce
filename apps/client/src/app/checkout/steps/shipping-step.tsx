'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { useCheckoutStore } from '@/stores/checkout-store';
import { api } from '@/lib/api';

interface ShippingOption {
  id: string;
  name: string;
  cost: number;
  estimatedDays?: string;
}

export function ShippingStep() {
  const subtotal = useCartStore((s) => s.subtotal);
  const shippingAddress = useCheckoutStore((s) => s.shippingAddress);
  const setShippingMethod = useCheckoutStore((s) => s.setShippingMethod);
  const currentMethod = useCheckoutStore((s) => s.shippingMethod);
  const setStep = useCheckoutStore((s) => s.setStep);

  const [methods, setMethods] = useState<ShippingOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>(currentMethod?.id || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchMethods() {
      if (!shippingAddress) return;
      setLoading(true);
      setError('');
      try {
        const res = await api.shipping.calculate({
          country: shippingAddress.country,
          state: shippingAddress.state,
          cartSubtotal: subtotal(),
        });
        if (res.success && res.data) {
          setMethods(res.data);
          if (res.data.length > 0 && !selectedId) {
            setSelectedId(res.data[0]!.id);
          }
        }
      } catch (err) {
        setError('Failed to load shipping methods. Using standard shipping.');
        // Fallback
        setMethods([
          { id: 'standard', name: 'Standard Shipping', cost: 999, estimatedDays: '5-7 business days' },
          { id: 'express', name: 'Express Shipping', cost: 1999, estimatedDays: '2-3 business days' },
        ]);
        if (!selectedId) setSelectedId('standard');
      } finally {
        setLoading(false);
      }
    }
    fetchMethods();
  }, [shippingAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = () => {
    const method = methods.find((m) => m.id === selectedId);
    if (!method) return;
    setShippingMethod(method);
    setStep(3);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-900">Shipping Method</h2>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse bg-neutral-50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-900">Shipping Method</h2>
        <button
          onClick={() => setStep(1)}
          className="text-xs font-medium tracking-wider text-neutral-500 uppercase hover:text-neutral-900"
        >
          Edit Address
        </button>
      </div>

      {/* Show selected address summary */}
      {shippingAddress && (
        <div className="bg-neutral-50 p-4 text-sm text-neutral-600">
          <p className="font-medium text-neutral-900">{shippingAddress.firstName} {shippingAddress.lastName}</p>
          <p>{shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
        </div>
      )}

      {error && <p className="text-xs text-amber-600">{error}</p>}

      <div className="space-y-3">
        {methods.map((method) => (
          <label
            key={method.id}
            className={`flex items-center justify-between border p-4 cursor-pointer transition ${
              selectedId === method.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping"
                value={method.id}
                checked={selectedId === method.id}
                onChange={() => setSelectedId(method.id)}
              />
              <div>
                <p className="text-sm font-medium text-neutral-900">{method.name}</p>
                {method.estimatedDays && (
                  <p className="text-xs text-neutral-500">{method.estimatedDays}</p>
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-neutral-900">
              {method.cost === 0 ? 'Free' : `$${(method.cost / 100).toFixed(2)}`}
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selectedId}
        className="w-full bg-neutral-900 py-3.5 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
      >
        Continue to Payment
      </button>
    </div>
  );
}
