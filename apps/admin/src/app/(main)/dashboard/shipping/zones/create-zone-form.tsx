'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { ShippingZone } from '@repo/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateZoneFormProps {
  onSuccess: () => void;
  zone?: ShippingZone | null;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'IN', name: 'India' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'BE', name: 'Belgium' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NZ', name: 'New Zealand' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const CA_PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
];

export function CreateZoneForm({ onSuccess, zone }: CreateZoneFormProps) {
  const { getToken } = useAuth();
  const isEditing = !!zone;

  const [name, setName] = useState(zone?.name ?? '');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(zone?.countries ?? []);
  const [selectedStates, setSelectedStates] = useState<string[]>(zone?.states ?? []);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    zone?.freeShippingThreshold ? String(zone.freeShippingThreshold / 100) : ''
  );
  const [isActive, setIsActive] = useState(zone?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(zone?.name ?? '');
    setSelectedCountries(zone?.countries ?? []);
    setSelectedStates(zone?.states ?? []);
    setFreeShippingThreshold(zone?.freeShippingThreshold ? String(zone.freeShippingThreshold / 100) : '');
    setIsActive(zone?.isActive ?? true);
  }, [zone]);

  const showStateSelection = selectedCountries.includes('US') || selectedCountries.includes('CA');

  const handleCountryToggle = (countryCode: string) => {
    setSelectedCountries((prev) =>
      prev.includes(countryCode)
        ? prev.filter((c) => c !== countryCode)
        : [...prev, countryCode]
    );
  };

  const handleStateToggle = (stateCode: string) => {
    setSelectedStates((prev) =>
      prev.includes(stateCode)
        ? prev.filter((s) => s !== stateCode)
        : [...prev, stateCode]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Zone name is required');
      return;
    }

    if (selectedCountries.length === 0) {
      setError('Select at least one country');
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();

      const data: any = {
        name: name.trim(),
        countries: selectedCountries,
        states: selectedStates,
        isActive,
      };

      if (freeShippingThreshold) {
        const threshold = parseFloat(freeShippingThreshold);
        if (isNaN(threshold) || threshold < 0) {
          setError('Free shipping threshold must be a valid positive number');
          return;
        }
        data.freeShippingThreshold = Math.round(threshold * 100);
      }

      if (isEditing && zone) {
        await api.shipping.zones.update(zone.id, data, token || undefined);
      } else {
        await api.shipping.zones.create(data, token || undefined);
      }

      setName('');
      setSelectedCountries([]);
      setSelectedStates([]);
      setFreeShippingThreshold('');
      setIsActive(true);
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} zone`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      <div>
        <Label htmlFor="name">
          Zone Name <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1"
          placeholder="e.g., North America, Europe, Domestic"
        />
      </div>

      <div>
        <Label>
          Countries <span className="text-red-500">*</span>
        </Label>
        <div className="mt-2 grid max-h-60 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
          {COUNTRIES.map((country) => (
            <label key={country.code} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedCountries.includes(country.code)}
                onChange={() => handleCountryToggle(country.code)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm text-foreground">
                {country.name} ({country.code})
              </span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Select one or more countries for this zone
        </p>
      </div>

      {showStateSelection && (
        <div>
          <Label>
            States/Provinces (Optional)
          </Label>
          <div className="mt-2 grid max-h-48 grid-cols-3 gap-2 overflow-y-auto rounded-md border p-3">
            {selectedCountries.includes('US') && (
              <>
                <div className="col-span-3 mb-1 text-xs font-semibold text-muted-foreground">
                  US States
                </div>
                {US_STATES.map((state) => (
                  <label key={state} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedStates.includes(state)}
                      onChange={() => handleStateToggle(state)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-sm text-foreground">{state}</span>
                  </label>
                ))}
              </>
            )}
            {selectedCountries.includes('CA') && (
              <>
                <div className="col-span-3 mb-1 mt-2 text-xs font-semibold text-muted-foreground">
                  Canadian Provinces
                </div>
                {CA_PROVINCES.map((province) => (
                  <label key={province} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedStates.includes(province)}
                      onChange={() => handleStateToggle(province)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-sm text-foreground">{province}</span>
                  </label>
                ))}
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Leave empty to apply to all states/provinces in selected countries
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="threshold">
          Free Shipping Threshold
        </Label>
        <div className="relative mt-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-muted-foreground">$</span>
          </div>
          <Input
            type="number"
            id="threshold"
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(e.target.value)}
            step="0.01"
            min="0"
            className="pl-7"
            placeholder="0.00"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Orders above this amount get free shipping. Leave empty for no free shipping.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(!!checked)}
        />
        <Label htmlFor="isActive" className="text-sm">
          Active
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEditing ? 'Update Zone' : 'Create Zone'}
        </Button>
      </div>
    </form>
  );
}
