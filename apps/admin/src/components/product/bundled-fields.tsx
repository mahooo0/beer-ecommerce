'use client';

import { useState } from 'react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import type { ProductFormData } from '@repo/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface BundledFieldsProps {
  form: UseFormReturn<ProductFormData>;
  products: Product[];
}

export function BundledFields({ form, products }: BundledFieldsProps) {
  const [searchTerms, setSearchTerms] = useState<string[]>([]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'bundleItems' as any,
  });

  const handleAddItem = () => {
    append({
      productId: '',
      quantity: 1,
      discount: 0,
    } as any);
    setSearchTerms([...searchTerms, '']);
  };

  const handleRemoveItem = (index: number) => {
    remove(index);
    const newSearchTerms = [...searchTerms];
    newSearchTerms.splice(index, 1);
    setSearchTerms(newSearchTerms);
  };

  const handleSearchChange = (index: number, value: string) => {
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = value;
    setSearchTerms(newSearchTerms);
  };

  const getFilteredProducts = (index: number) => {
    const searchTerm = searchTerms[index] || '';
    if (!searchTerm) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getSelectedProduct = (productId: string) => {
    return products.find((p) => p.id === productId);
  };

  const calculateBundleSavings = () => {
    let totalIndividualPrice = 0;
    let totalDiscount = 0;

    fields.forEach((field, index) => {
      const values = form.watch(`bundleItems.${index}` as any);
      if (!values) return;

      const product = getSelectedProduct(values.productId);
      if (!product) return;

      const quantity = values.quantity || 1;
      const discount = values.discount || 0;

      totalIndividualPrice += product.price * quantity;
      totalDiscount += discount * quantity;
    });

    const bundlePrice = totalIndividualPrice - totalDiscount;
    const savings = totalDiscount;

    return {
      individualPrice: totalIndividualPrice,
      bundlePrice,
      savings,
      savingsPercent: totalIndividualPrice > 0 ? (savings / totalIndividualPrice) * 100 : 0,
    };
  };

  const bundleErrors = (form.formState.errors as any).bundleItems;
  const savings = calculateBundleSavings();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Bundle Items</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add at least 2 products to create a bundle
          </p>
        </div>
        <Button
          type="button"
          onClick={handleAddItem}
          disabled={products.length < 2}
          size="sm"
        >
          Add Item
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="text-sm text-muted-foreground py-4 border border-dashed border-input rounded-md text-center">
          No bundle items added yet. Click &quot;Add Item&quot; to start building your bundle.
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => {
          const itemErrors = Array.isArray(bundleErrors) ? bundleErrors[index] : undefined;
          const selectedProductId = form.watch(`bundleItems.${index}.productId` as any);
          const selectedProduct = getSelectedProduct(selectedProductId);
          const quantity = form.watch(`bundleItems.${index}.quantity` as any) || 1;

          return (
            <div
              key={field.id}
              className="border border-input rounded-lg p-4 space-y-4 bg-muted"
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-foreground">Item {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleRemoveItem(index)}
                >
                  Remove
                </Button>
              </div>

              <div className="space-y-4">
                {/* Product Selector with Search */}
                <div>
                  <Label className="mb-1">
                    Product *
                  </Label>
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={searchTerms[index] || ''}
                      onChange={(e) => handleSearchChange(index, e.target.value)}
                      placeholder="Search products..."
                    />
                    <Select
                      value={form.watch(`bundleItems.${index}.productId` as any) || ''}
                      onValueChange={(v) => form.setValue(`bundleItems.${index}.productId` as any, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredProducts(index).map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ${(product.price / 100).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {itemErrors?.productId && (
                    <p className="mt-1 text-sm text-red-600">
                      {itemErrors.productId.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quantity */}
                  <div>
                    <Label className="mb-1">
                      Quantity *
                    </Label>
                    <Input
                      {...form.register(`bundleItems.${index}.quantity` as any, {
                        valueAsNumber: true,
                      })}
                      type="number"
                      placeholder="1"
                      min="1"
                      step="1"
                    />
                    {itemErrors?.quantity && (
                      <p className="mt-1 text-sm text-red-600">
                        {itemErrors.quantity.message}
                      </p>
                    )}
                  </div>

                  {/* Discount */}
                  <div>
                    <Label className="mb-1">
                      Discount (cents)
                    </Label>
                    <Input
                      {...form.register(`bundleItems.${index}.discount` as any, {
                        valueAsNumber: true,
                      })}
                      type="number"
                      placeholder="0"
                      min="0"
                      step="1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Discount per item in cents
                    </p>
                    {itemErrors?.discount && (
                      <p className="mt-1 text-sm text-red-600">
                        {itemErrors.discount.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Selected Product Info */}
                {selectedProduct && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {selectedProduct.name} x {quantity}
                      </span>
                      <span className="font-medium text-foreground">
                        ${((selectedProduct.price * quantity) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bundle Pricing Summary */}
      {fields.length >= 2 && savings.individualPrice > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">Bundle Savings</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Individual prices total:</span>
              <span>${(savings.individualPrice / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Total discounts:</span>
              <span className="text-red-600">-${(savings.savings / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-green-900 pt-2 border-t border-green-200">
              <span>Bundle price:</span>
              <span>${(savings.bundlePrice / 100).toFixed(2)}</span>
            </div>
            {savings.savingsPercent > 0 && (
              <div className="text-xs text-green-700 text-right">
                Save {savings.savingsPercent.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      )}

      {bundleErrors && !Array.isArray(bundleErrors) && (
        <p className="text-sm text-red-600">{bundleErrors.message}</p>
      )}
    </div>
  );
}
