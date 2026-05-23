'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '@repo/types';
import { api } from '@/lib/api';
import { ImageManager } from './image-manager';
import { SimpleFields } from './simple-fields';
import { VariableFields } from './variable-fields';
import { WeightedFields } from './weighted-fields';
import { DigitalFields } from './digital-fields';
import { BundledFields } from './bundled-fields';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  path: string;
}

interface Brand {
  id: string;
  name: string;
}

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

interface ProductReference {
  id: string;
  name: string;
  price: number;
}

interface ProductFormProps {
  defaultValues?: Partial<ProductFormData>;
  categories: Category[];
  brands: Brand[];
  optionGroups: OptionGroup[];
  products: ProductReference[];
  isEdit?: boolean;
  productId?: string;
}

export function ProductForm({
  defaultValues,
  categories,
  brands,
  optionGroups,
  products,
  isEdit = false,
  productId,
}: ProductFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<any>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: defaultValues || {
      productType: 'SIMPLE',
      name: '',
      description: '',
      price: 0,
      sku: '',
      categoryId: '',
      status: 'DRAFT',
      images: [],
      attributes: {},
      isActive: true,
    },
  });

  const productType = form.watch('productType');
  const images = form.watch('images');

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      if (isEdit && productId) {
        await api.products.update(productId, data as any, token || undefined);
      } else {
        await api.products.create(data as any, token || undefined);
      }

      router.push('/dashboard/products');
      router.refresh();
    } catch (err) {
      setError((err as Error).message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (newImages: string[]) => {
    form.setValue('images', newImages);
  };

  // Auto-generate SKU from name if empty
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);

    // Only auto-generate SKU if it's empty and we're creating a new product
    if (!isEdit && !form.getValues('sku')) {
      const sku = name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);
      if (sku) {
        form.setValue('sku', sku);
      }
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Base Fields */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>

            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Product Type *
              </label>
              <Select
                value={form.watch('productType')}
                onValueChange={(v) => form.setValue('productType', v)}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIMPLE">Simple Product</SelectItem>
                  <SelectItem value="VARIABLE">Variable Product</SelectItem>
                  <SelectItem value="WEIGHTED">Weighted Product</SelectItem>
                  <SelectItem value="DIGITAL">Digital Product</SelectItem>
                  <SelectItem value="BUNDLED">Bundled Product</SelectItem>
                </SelectContent>
              </Select>
              {isEdit && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Product type cannot be changed after creation
                </p>
              )}
              {form.formState.errors.productType && (
                <p className="mt-1 text-sm text-destructive">
                  {String(form.formState.errors.productType.message)}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Product Name *
              </label>
              <Input
                {...form.register('name')}
                type="text"
                onChange={handleNameChange}
                placeholder="Enter product name"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-destructive">
                  {String(form.formState.errors.name.message)}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Description *
              </label>
              <RichTextEditor
                value={form.watch('description') || ''}
                onChange={(html) => form.setValue('description', html, { shouldDirty: true })}
                placeholder="Describe your product"
              />
              {form.formState.errors.description && (
                <p className="mt-1 text-sm text-destructive">
                  {String(form.formState.errors.description.message)}
                </p>
              )}
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                SKU *
              </label>
              <Input
                {...form.register('sku')}
                type="text"
                placeholder="PRODUCT-SKU-001"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Unique product identifier (auto-generated from name if empty)
              </p>
              {form.formState.errors.sku && (
                <p className="mt-1 text-sm text-destructive">
                  {String(form.formState.errors.sku.message)}
                </p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Pricing</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Base Price */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Base Price (cents) *
                </label>
                <Input
                  {...form.register('price', { valueAsNumber: true })}
                  type="number"
                  placeholder="1999"
                  min="0"
                  step="1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Price in cents (e.g., 1999 = $19.99)
                </p>
                {form.formState.errors.price && (
                  <p className="mt-1 text-sm text-destructive">
                    {String(form.formState.errors.price.message)}
                  </p>
                )}
              </div>

              {/* Compare At Price */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Compare At Price (cents)
                </label>
                <Input
                  {...form.register('compareAtPrice', { valueAsNumber: true })}
                  type="number"
                  placeholder="2499"
                  min="0"
                  step="1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Optional - show as strikethrough price
                </p>
                {form.formState.errors.compareAtPrice && (
                  <p className="mt-1 text-sm text-destructive">
                    {String(form.formState.errors.compareAtPrice.message)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Organization */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Organization</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Category *
                </label>
                <Select
                  value={form.watch('categoryId') || ''}
                  onValueChange={(v) => form.setValue('categoryId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.path || category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="mt-1 text-sm text-destructive">
                    {String(form.formState.errors.categoryId.message)}
                  </p>
                )}
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Brand
                </label>
                <Select
                  value={form.watch('brandId') || ''}
                  onValueChange={(v) => form.setValue('brandId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a brand (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Status *
                </label>
                <Select
                  value={form.watch('status') || 'DRAFT'}
                  onValueChange={(v) => form.setValue('status', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Type-Specific Fields */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Product Type Details
            </h2>

            {productType === 'SIMPLE' && <SimpleFields form={form} />}
            {productType === 'VARIABLE' && (
              <VariableFields form={form} optionGroups={optionGroups} />
            )}
            {productType === 'WEIGHTED' && <WeightedFields form={form} />}
            {productType === 'DIGITAL' && <DigitalFields form={form} />}
            {productType === 'BUNDLED' && (
              <BundledFields
                form={form}
                products={products.filter((p) => p.id !== productId)}
              />
            )}
          </div>
        </div>

        {/* Right Column - Media */}
        <div className="lg:col-span-1">
          <div className="bg-card border rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-foreground mb-4">Media</h2>
            <ImageManager
              images={images || []}
              onChange={handleImageChange}
              maxFiles={10}
            />
          </div>
        </div>
      </div>

      {/* Submit Button - Sticky at bottom */}
      <div className="sticky bottom-0 bg-card border-t p-4 -mx-4 flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/products')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
