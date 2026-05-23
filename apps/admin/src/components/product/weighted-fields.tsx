'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { ProductFormData } from '@repo/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WeightedFieldsProps {
  form: UseFormReturn<ProductFormData>;
}

export function WeightedFields({ form }: WeightedFieldsProps) {
  const errors = (form.formState.errors as any).weightedMeta;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Weight-Based Pricing</h3>
        <p className="text-sm text-muted-foreground">
          Configure unit pricing for products sold by weight. Customers will select the desired weight
          at checkout, and the price will be calculated automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unit */}
        <div>
          <Label className="mb-1">
            Weight Unit *
          </Label>
          <Select
            value={form.watch('weightedMeta.unit' as any) || ''}
            onValueChange={(v) => form.setValue('weightedMeta.unit' as any, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KG">Kilograms (KG)</SelectItem>
              <SelectItem value="LB">Pounds (LB)</SelectItem>
              <SelectItem value="OZ">Ounces (OZ)</SelectItem>
              <SelectItem value="G">Grams (G)</SelectItem>
            </SelectContent>
          </Select>
          {errors?.unit && (
            <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
          )}
        </div>

        {/* Price Per Unit */}
        <div>
          <Label className="mb-1">
            Price Per Unit (cents) *
          </Label>
          <Input
            {...form.register('weightedMeta.pricePerUnit' as any, {
              valueAsNumber: true,
            })}
            type="number"
            placeholder="999"
            min="0"
            step="1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Price in cents per unit (e.g., 999 = $9.99/kg)
          </p>
          {errors?.pricePerUnit && (
            <p className="mt-1 text-sm text-red-600">{errors.pricePerUnit.message}</p>
          )}
        </div>

        {/* Min Weight */}
        <div>
          <Label className="mb-1">
            Minimum Weight
          </Label>
          <Input
            {...form.register('weightedMeta.minWeight' as any, {
              valueAsNumber: true,
            })}
            type="number"
            placeholder="0.1"
            min="0"
            step="0.01"
          />
          <p className="mt-1 text-xs text-muted-foreground">Optional minimum order weight</p>
          {errors?.minWeight && (
            <p className="mt-1 text-sm text-red-600">{errors.minWeight.message}</p>
          )}
        </div>

        {/* Max Weight */}
        <div>
          <Label className="mb-1">
            Maximum Weight
          </Label>
          <Input
            {...form.register('weightedMeta.maxWeight' as any, {
              valueAsNumber: true,
            })}
            type="number"
            placeholder="10"
            min="0"
            step="0.01"
          />
          <p className="mt-1 text-xs text-muted-foreground">Optional maximum order weight</p>
          {errors?.maxWeight && (
            <p className="mt-1 text-sm text-red-600">{errors.maxWeight.message}</p>
          )}
        </div>

        {/* Step Weight */}
        <div className="md:col-span-2">
          <Label className="mb-1">
            Weight Step/Increment
          </Label>
          <Input
            {...form.register('weightedMeta.stepWeight' as any, {
              valueAsNumber: true,
            })}
            type="number"
            placeholder="0.1"
            min="0.01"
            step="0.01"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Optional weight increment for selection (e.g., 0.1 for 100g steps)
          </p>
          {errors?.stepWeight && (
            <p className="mt-1 text-sm text-red-600">{errors.stepWeight.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
