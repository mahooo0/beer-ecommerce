'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/utils';

interface WeightedQuantitySelectorProps {
  pricePerUnit: number;
  unit: string;
  minWeight?: number;
  maxWeight?: number;
  onWeightChange: (weight: number) => void;
  onPriceChange: (totalCents: number) => void;
}

export function WeightedQuantitySelector({
  pricePerUnit,
  unit,
  minWeight = 0.1,
  maxWeight = 10,
  onWeightChange,
  onPriceChange,
}: WeightedQuantitySelectorProps) {
  const [weight, setWeight] = useState<number>(minWeight);

  const totalCents = Math.round(pricePerUnit * weight);

  function handleChange(newWeight: number) {
    const clamped = Math.min(Math.max(newWeight, minWeight), maxWeight);
    setWeight(clamped);
    onWeightChange(clamped);
    onPriceChange(Math.round(pricePerUnit * clamped));
  }

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-gray-800">
        {formatPrice(pricePerUnit)}{' '}
        <span className="text-base font-normal text-gray-500">per {unit}</span>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Quantity ({unit})
        </label>

        <input
          type="range"
          min={minWeight}
          max={maxWeight}
          step={0.1}
          value={weight}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          className="w-full accent-blue-600"
        />

        <input
          type="number"
          min={minWeight}
          max={maxWeight}
          step={0.1}
          value={weight}
          onChange={(e) => handleChange(parseFloat(e.target.value) || minWeight)}
          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </div>

      <div className="rounded-lg bg-gray-50 p-3">
        <span className="text-sm text-gray-500">Total price:</span>
        <span className="ml-2 text-xl font-bold text-gray-900">
          {formatPrice(totalCents)}
        </span>
      </div>
    </div>
  );
}
