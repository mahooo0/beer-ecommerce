'use client';

import { useEffect, useState } from 'react';
import { useCheckoutStore } from '@/stores/checkout-store';
import { getAddresses } from '@/app/profile/addresses/actions';

interface SavedAddress {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  street2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string | null;
  label?: string | null;
  isDefault: boolean;
}

export function AddressStep() {
  const setShippingAddress = useCheckoutStore((s) => s.setShippingAddress);
  const setBillingAddress = useCheckoutStore((s) => s.setBillingAddress);
  const billingSameAsShipping = useCheckoutStore((s) => s.billingSameAsShipping);
  const setBillingSameAsShipping = useCheckoutStore((s) => s.setBillingSameAsShipping);
  const setStep = useCheckoutStore((s) => s.setStep);
  const currentShippingAddress = useCheckoutStore((s) => s.shippingAddress);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
  });

  useEffect(() => {
    async function loadAddresses() {
      try {
        const addresses = await getAddresses();
        setSavedAddresses(addresses as SavedAddress[]);
        const defaultAddr = addresses.find((a: SavedAddress) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        }
      } catch {
        // No addresses yet
      } finally {
        setLoading(false);
      }
    }
    loadAddresses();
  }, []);

  // If returning to this step, pre-fill
  useEffect(() => {
    if (currentShippingAddress) {
      setForm({
        firstName: currentShippingAddress.firstName,
        lastName: currentShippingAddress.lastName,
        street: currentShippingAddress.street,
        street2: currentShippingAddress.street2 || '',
        city: currentShippingAddress.city,
        state: currentShippingAddress.state,
        zipCode: currentShippingAddress.zipCode,
        country: currentShippingAddress.country,
        phone: currentShippingAddress.phone || '',
      });
    }
  }, [currentShippingAddress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let address;
    if (selectedAddressId !== 'new') {
      const saved = savedAddresses.find((a) => a.id === selectedAddressId);
      if (!saved) return;
      address = {
        firstName: saved.firstName,
        lastName: saved.lastName,
        street: saved.street,
        street2: saved.street2 || undefined,
        city: saved.city,
        state: saved.state,
        zipCode: saved.zipCode,
        country: saved.country,
        phone: saved.phone || undefined,
      };
    } else {
      if (!form.firstName || !form.lastName || !form.street || !form.city || !form.state || !form.zipCode) {
        return;
      }
      address = {
        firstName: form.firstName,
        lastName: form.lastName,
        street: form.street,
        street2: form.street2 || undefined,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        country: form.country,
        phone: form.phone || undefined,
      };
    }

    setShippingAddress(address);
    if (billingSameAsShipping) {
      setBillingAddress(null);
    }
    setStep(2);
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-neutral-50 rounded" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-medium text-neutral-900">Shipping Address</h2>

      {savedAddresses.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500">Select a saved address or enter a new one</p>
          <div className="grid gap-3">
            {savedAddresses.map((addr) => (
              <label
                key={addr.id}
                className={`flex items-start gap-3 border p-4 cursor-pointer transition ${
                  selectedAddressId === addr.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="savedAddress"
                  value={addr.id}
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="mt-1"
                />
                <div className="text-sm">
                  <p className="font-medium text-neutral-900">
                    {addr.firstName} {addr.lastName}
                    {addr.label && <span className="ml-2 text-neutral-400">({addr.label})</span>}
                    {addr.isDefault && <span className="ml-2 text-xs bg-neutral-100 px-2 py-0.5 rounded">Default</span>}
                  </p>
                  <p className="text-neutral-500">{addr.street}, {addr.city}, {addr.state} {addr.zipCode}</p>
                </div>
              </label>
            ))}
            <label
              className={`flex items-center gap-3 border p-4 cursor-pointer transition ${
                selectedAddressId === 'new' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <input
                type="radio"
                name="savedAddress"
                value="new"
                checked={selectedAddressId === 'new'}
                onChange={() => setSelectedAddressId('new')}
              />
              <span className="text-sm font-medium text-neutral-900">Enter a new address</span>
            </label>
          </div>
        </div>
      )}

      {selectedAddressId === 'new' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">First Name *</label>
            <input
              type="text"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Last Name *</label>
            <input
              type="text"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-neutral-500 mb-1">Street Address *</label>
            <input
              type="text"
              required
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-neutral-500 mb-1">Apartment, suite, etc.</label>
            <input
              type="text"
              value={form.street2}
              onChange={(e) => setForm({ ...form, street2: e.target.value })}
              className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">City *</label>
            <input
              type="text"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">State *</label>
            <input
              type="text"
              required
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">ZIP Code *</label>
            <input
              type="text"
              required
              value={form.zipCode}
              onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
              className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Country *</label>
            <input
              type="text"
              required
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-neutral-500 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>
      )}

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={billingSameAsShipping}
          onChange={(e) => setBillingSameAsShipping(e.target.checked)}
          className="size-4 rounded border-neutral-300"
        />
        <span className="text-sm text-neutral-700">Billing address same as shipping</span>
      </label>

      <button
        type="submit"
        className="w-full bg-neutral-900 py-3.5 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-neutral-800"
      >
        Continue to Shipping
      </button>
    </form>
  );
}
