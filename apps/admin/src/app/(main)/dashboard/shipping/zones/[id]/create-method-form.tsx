'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { ShippingRateType } from '@repo/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateMethodFormProps {
  zoneId: string;
  onSuccess: () => void;
}

interface PriceTier {
  minAmount: string;
  shippingCost: string;
}

export function CreateMethodForm({ zoneId, onSuccess }: CreateMethodFormProps) {
  const { getToken } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rateType, setRateType] = useState<keyof typeof ShippingRateType>('FLAT_RATE');
  const [flatRate, setFlatRate] = useState('');
  const [weightRate, setWeightRate] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([{ minAmount: '', shippingCost: '' }]);
  const [estimatedDaysMin, setEstimatedDaysMin] = useState('');
  const [estimatedDaysMax, setEstimatedDaysMax] = useState('');
  const [position, setPosition] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddTier = () => {
    setPriceTiers([...priceTiers, { minAmount: '', shippingCost: '' }]);
  };

  const handleRemoveTier = (index: number) => {
    setPriceTiers(priceTiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: keyof PriceTier, value: string) => {
    const newTiers = [...priceTiers];
    if (newTiers[index]) {
      newTiers[index][field] = value;
      setPriceTiers(newTiers);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Method name is required');
      return;
    }

    try {
      setLoading(true);

      const data: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        rateType,
        estimatedDaysMin: estimatedDaysMin ? parseInt(estimatedDaysMin) : undefined,
        estimatedDaysMax: estimatedDaysMax ? parseInt(estimatedDaysMax) : undefined,
        position: parseInt(position),
        isActive,
      };

      // Validate and convert rate type specific fields
      if (rateType === 'FLAT_RATE') {
        if (!flatRate) {
          setError('Flat rate is required for flat rate shipping');
          return;
        }
        const rate = parseFloat(flatRate);
        if (isNaN(rate) || rate < 0) {
          setError('Flat rate must be a valid positive number');
          return;
        }
        data.flatRate = Math.round(rate * 100);
      } else if (rateType === 'WEIGHT_BASED') {
        if (!weightRate) {
          setError('Weight rate is required for weight-based shipping');
          return;
        }
        const rate = parseFloat(weightRate);
        if (isNaN(rate) || rate < 0) {
          setError('Weight rate must be a valid positive number');
          return;
        }
        data.weightRate = Math.round(rate * 100);

        if (minWeight) {
          const min = parseFloat(minWeight);
          if (isNaN(min) || min < 0) {
            setError('Minimum weight must be a valid positive number');
            return;
          }
          data.minWeight = min;
        }

        if (maxWeight) {
          const max = parseFloat(maxWeight);
          if (isNaN(max) || max < 0) {
            setError('Maximum weight must be a valid positive number');
            return;
          }
          data.maxWeight = max;
        }
      } else if (rateType === 'PRICE_BASED') {
        if (priceTiers.length === 0 || !priceTiers[0]?.minAmount || !priceTiers[0]?.shippingCost) {
          setError('At least one price tier is required for price-based shipping');
          return;
        }

        const tiers = priceTiers.map((tier, index) => {
          const minAmount = parseFloat(tier.minAmount);
          const shippingCost = parseFloat(tier.shippingCost);

          if (isNaN(minAmount) || minAmount < 0) {
            throw new Error(`Tier ${index + 1}: Minimum amount must be a valid positive number`);
          }
          if (isNaN(shippingCost) || shippingCost < 0) {
            throw new Error(`Tier ${index + 1}: Shipping cost must be a valid positive number`);
          }

          return {
            minAmount: Math.round(minAmount * 100),
            shippingCost: Math.round(shippingCost * 100),
          };
        });

        // Sort tiers by minAmount ascending
        tiers.sort((a, b) => a.minAmount - b.minAmount);
        data.priceThresholds = tiers;
      }

      const token = await getToken();
      const response = await api.shipping.methods.create(zoneId, data, token || undefined);
      if (response.success) {
        // Reset form
        setName('');
        setDescription('');
        setRateType('FLAT_RATE');
        setFlatRate('');
        setWeightRate('');
        setMinWeight('');
        setMaxWeight('');
        setPriceTiers([{ minAmount: '', shippingCost: '' }]);
        setEstimatedDaysMin('');
        setEstimatedDaysMax('');
        setPosition('0');
        setIsActive(true);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create method');
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
          Method Name <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1"
          placeholder="e.g., Standard Shipping, Express, Economy"
        />
      </div>

      <div>
        <Label htmlFor="description">
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={500}
          className="mt-1"
          placeholder="Optional description of this shipping method"
        />
        <p className="mt-1 text-xs text-muted-foreground">{description.length}/500 characters</p>
      </div>

      <div>
        <Label>
          Rate Type <span className="text-red-500">*</span>
        </Label>
        <div className="mt-2 space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="FLAT_RATE"
              checked={rateType === 'FLAT_RATE'}
              onChange={(e) => setRateType(e.target.value as keyof typeof ShippingRateType)}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-muted-foreground">Flat Rate</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="WEIGHT_BASED"
              checked={rateType === 'WEIGHT_BASED'}
              onChange={(e) => setRateType(e.target.value as keyof typeof ShippingRateType)}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-muted-foreground">Weight-Based</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="PRICE_BASED"
              checked={rateType === 'PRICE_BASED'}
              onChange={(e) => setRateType(e.target.value as keyof typeof ShippingRateType)}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-muted-foreground">Price-Based</span>
          </label>
        </div>
      </div>

      {/* Rate Type Specific Fields */}
      {rateType === 'FLAT_RATE' && (
        <div>
          <Label htmlFor="flatRate">
            Flat Rate <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-muted-foreground">$</span>
            </div>
            <Input
              type="number"
              id="flatRate"
              value={flatRate}
              onChange={(e) => setFlatRate(e.target.value)}
              step="0.01"
              min="0"
              className="pl-7"
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      {rateType === 'WEIGHT_BASED' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="weightRate">
              Weight Rate (per kg) <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-muted-foreground">$</span>
              </div>
              <Input
                type="number"
                id="weightRate"
                value={weightRate}
                onChange={(e) => setWeightRate(e.target.value)}
                step="0.01"
                min="0"
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minWeight">
                Min Weight (kg)
              </Label>
              <Input
                type="number"
                id="minWeight"
                value={minWeight}
                onChange={(e) => setMinWeight(e.target.value)}
                step="0.01"
                min="0"
                className="mt-1"
                placeholder="Optional"
              />
            </div>

            <div>
              <Label htmlFor="maxWeight">
                Max Weight (kg)
              </Label>
              <Input
                type="number"
                id="maxWeight"
                value={maxWeight}
                onChange={(e) => setMaxWeight(e.target.value)}
                step="0.01"
                min="0"
                className="mt-1"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>
      )}

      {rateType === 'PRICE_BASED' && (
        <div>
          <Label>
            Price Tiers <span className="text-red-500">*</span>
          </Label>
          <div className="mt-2 space-y-2">
            {priceTiers.map((tier, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-muted-foreground">$</span>
                    </div>
                    <Input
                      type="number"
                      value={tier.minAmount}
                      onChange={(e) => handleTierChange(index, 'minAmount', e.target.value)}
                      step="0.01"
                      min="0"
                      className="pl-7"
                      placeholder="Cart minimum"
                    />
                  </div>
                </div>
                <span className="text-muted-foreground">{'\u2192'}</span>
                <div className="flex-1">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-muted-foreground">$</span>
                    </div>
                    <Input
                      type="number"
                      value={tier.shippingCost}
                      onChange={(e) => handleTierChange(index, 'shippingCost', e.target.value)}
                      step="0.01"
                      min="0"
                      className="pl-7"
                      placeholder="Shipping cost"
                    />
                  </div>
                </div>
                {priceTiers.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRemoveTier(index)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="link"
            onClick={handleAddTier}
            className="mt-2 px-0 text-sm"
          >
            + Add Tier
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Set shipping cost based on cart total. Lower thresholds will be matched first.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="estimatedDaysMin">
            Estimated Days (Min)
          </Label>
          <Input
            type="number"
            id="estimatedDaysMin"
            value={estimatedDaysMin}
            onChange={(e) => setEstimatedDaysMin(e.target.value)}
            min="0"
            className="mt-1"
            placeholder="Optional"
          />
        </div>

        <div>
          <Label htmlFor="estimatedDaysMax">
            Estimated Days (Max)
          </Label>
          <Input
            type="number"
            id="estimatedDaysMax"
            value={estimatedDaysMax}
            onChange={(e) => setEstimatedDaysMax(e.target.value)}
            min="0"
            className="mt-1"
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="position">
          Position
        </Label>
        <Input
          type="number"
          id="position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          min="0"
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">Display order (lower numbers appear first)</p>
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
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Method'}
        </Button>
      </div>
    </form>
  );
}
