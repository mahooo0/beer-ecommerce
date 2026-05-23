'use client';

import { useFieldArray, Controller, type UseFormReturn } from 'react-hook-form';
import type { ProductFormData } from '@repo/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OptionGroup {
  id: string;
  name: string;
  displayName: string;
  values: Array<{
    id: string;
    value: string;
    label: string;
  }>;
}

interface VariableFieldsProps {
  form: UseFormReturn<ProductFormData>;
  optionGroups: OptionGroup[];
}

export function VariableFields({ form, optionGroups }: VariableFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants' as any,
  });

  const handleAddVariant = () => {
    append({
      sku: '',
      price: 0,
      stock: 0,
      isActive: true,
      options: [],
    } as any);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Variants</h3>
        <Button
          type="button"
          onClick={handleAddVariant}
          size="sm"
        >
          Add Variant
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="text-sm text-muted-foreground py-4 border border-dashed border-input rounded-md text-center">
          No variants added yet. Click &quot;Add Variant&quot; to create the first variant.
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => {
          const variantErrors = (form.formState.errors as any).variants?.[index];

          return (
            <div
              key={field.id}
              className="border border-input rounded-lg p-4 space-y-4 bg-muted"
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-foreground">Variant {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SKU */}
                <div>
                  <Label className="mb-1">
                    SKU *
                  </Label>
                  <Input
                    {...form.register(`variants.${index}.sku` as any)}
                    type="text"
                    placeholder="VARIANT-SKU-001"
                  />
                  {variantErrors?.sku && (
                    <p className="mt-1 text-sm text-red-600">
                      {variantErrors.sku.message}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <Label className="mb-1">
                    Price (cents) *
                  </Label>
                  <Input
                    {...form.register(`variants.${index}.price` as any, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    placeholder="1999"
                    min="0"
                    step="1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Price in cents (e.g., 1999 = $19.99)</p>
                  {variantErrors?.price && (
                    <p className="mt-1 text-sm text-red-600">
                      {variantErrors.price.message}
                    </p>
                  )}
                </div>

                {/* Stock */}
                <div>
                  <Label className="mb-1">
                    Stock
                  </Label>
                  <Input
                    {...form.register(`variants.${index}.stock` as any, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    placeholder="100"
                    min="0"
                  />
                  {variantErrors?.stock && (
                    <p className="mt-1 text-sm text-red-600">
                      {variantErrors.stock.message}
                    </p>
                  )}
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2 pt-6">
                  <Controller
                    control={form.control}
                    name={`variants.${index}.isActive` as any}
                    render={({ field: checkboxField }) => (
                      <Checkbox
                        checked={checkboxField.value}
                        onCheckedChange={checkboxField.onChange}
                      />
                    )}
                  />
                  <Label>
                    Active
                  </Label>
                </div>
              </div>

              {/* Option Selectors */}
              {optionGroups.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">
                    Options
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {optionGroups.map((group) => (
                      <div key={group.id}>
                        <Label className="mb-1">
                          {group.displayName}
                        </Label>
                        <Select
                          value={form.watch(`variants.${index}.options` as any) || ''}
                          onValueChange={(v) => form.setValue(`variants.${index}.options` as any, v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${group.displayName}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {group.values.map((value) => (
                              <SelectItem
                                key={value.id}
                                value={JSON.stringify({ groupId: group.id, valueId: value.id })}
                              >
                                {value.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(form.formState.errors as any).variants && !Array.isArray((form.formState.errors as any).variants) && (
        <p className="text-sm text-red-600">
          {(form.formState.errors as any).variants.message}
        </p>
      )}
    </div>
  );
}
