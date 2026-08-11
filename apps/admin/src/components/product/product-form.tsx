'use client';

/**
 * ProductForm — FLAT single React-Hook-Form product create/edit form.
 *
 * Rewritten from the old 4fr-style `productType` discriminated-union form into
 * one flat RHF form driven by the flat `productSchema` from `@repo/types`.
 * taranka has NO product variants — the Simple/Variable/Weighted/Digital/Bundled
 * branches and the productType Select are GONE.
 *
 * Fields (the user's INCLUDE list):
 *   name, category (CategoryPicker), price, salePrice, baseUnit,
 *   dual-mode STOCK (tab: "Кількість" numeric quantity | "Наявність" in/out flag),
 *   manufacturer, description (rich text), composition (rich text),
 *   slug (live-transliterated), attributes (<ProductAttributeFields/>),
 *   images (gallery), keywords (DISABLED — display only), status.
 *
 * SKU is omitted from the UI — the server auto-generates a unique sku.
 *
 * Attribute values live in RHF state as `attributeValues: {attributeId,
 * attributeValueId}[]` and are submitted with the flat payload. On a category
 * change the selections are RESET (a product's attributes belong to its
 * category).
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import { useForm, useFieldArray, Controller, type Resolver } from 'react-hook-form';
import { Trash2, Plus } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '@repo/types';
import type { ProductAttributeValueInput } from '@/lib/api';
import { api } from '@/lib/api';
import { ImageManager } from './image-manager';
import { ProductAttributeFields } from './product-attribute-fields';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { KeywordsInput } from '@/components/ui/keywords-input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import CategoryPicker from '@/components/CategoryPicker';
import { slugify, slugifyLive } from '@/lib/slug';
import { showError, showSuccess } from '@/lib/toast';

interface Brand {
  id: string;
  name: string;
}

interface ProductFormProps {
  defaultValues?: Partial<ProductFormData>;
  brands: Brand[];
  isEdit?: boolean;
  productId?: string;
}

// Full flat defaults so every controlled field starts defined.
const EMPTY_DEFAULTS: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  salePrice: null,
  categoryId: '',
  brandId: undefined,
  status: 'DRAFT',
  images: [],
  slug: '',
  baseUnit: 'piece',
  manufacturer: '',
  composition: '',
  searchKeywords: [],
  trackQuantity: false,
  quantity: 0,
  isAvailable: true,
  isActive: true,
  attributes: {},
  attributeValues: [],
  wholesaleTiers: [],
};

export function ProductForm({
  defaultValues,
  brands,
  isEdit = false,
  productId,
}: ProductFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks whether the admin has manually edited the slug — once true we stop
  // auto-deriving it from the name.
  const slugTouched = useRef<boolean>(Boolean(defaultValues?.slug));

  const form = useForm<ProductFormData>({
    // Cast: zod `.default()` fields make the schema's INPUT type diverge from the
    // inferred OUTPUT type (ProductFormData). The resolver is sound at runtime.
    resolver: zodResolver(productSchema) as unknown as Resolver<ProductFormData>,
    defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = form;

  const images = watch('images');
  const categoryId = watch('categoryId');
  const trackQuantity = watch('trackQuantity');
  const attributeValues = (watch('attributeValues') ?? []) as ProductAttributeValueInput[];

  // Wholesale quantity pricing tiers ("оптова ціна за кількість").
  const tierArray = useFieldArray({ control, name: 'wholesaleTiers' });
  const watchedTiers = watch('wholesaleTiers') ?? [];

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      // Normalize: cleared optional fields → null so the update service actually
      // writes the cleared value (undefined keys are dropped by JSON and skipped
      // by the `!== undefined` guards, so an emptied field would never clear).
      const payload: any = {
        ...data,
        salePrice: data.salePrice ? data.salePrice : null,
        manufacturer: data.manufacturer?.trim() || null,
        composition: data.composition?.trim() || null,
        slug: data.slug?.trim() ? slugify(data.slug) : undefined,
        attributeValues: attributeValues,
      };

      if (isEdit && productId) {
        await api.products.update(productId, payload as any, token || undefined);
        showSuccess(t('productForm.toasts.updated'));
      } else {
        await api.products.create(payload as any, token || undefined);
        showSuccess(t('productForm.toasts.created'));
      }
      router.push('/dashboard/products');
      router.refresh();
    } catch (err) {
      const msg = (err as Error).message || t('productForm.toasts.saveFailed');
      setError(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('name', name, { shouldDirty: true });
    // Auto-derive the slug from the name until the admin edits it by hand.
    if (!slugTouched.current) {
      setValue('slug', slugify(name), { shouldDirty: true });
    }
  };

  // Reset the normalized attribute selections whenever the category changes —
  // a product's attribute values belong to its category.
  const handleCategoryChange = (id: string | null) => {
    const next = id ?? '';
    if (next !== categoryId) {
      setValue('attributeValues', [], { shouldDirty: true });
    }
    setValue('categoryId', next, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h1 className="mb-6 text-2xl font-bold">
        {isEdit ? t('productForm.pageTitle.edit') : t('productForm.pageTitle.create')}
      </h1>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — main fields */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('productForm.sections.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-1 block">{t('productForm.fields.name')} *</Label>
                <Input
                  {...register('name')}
                  onChange={handleNameChange}
                  placeholder={t('productForm.placeholders.name')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-destructive">
                    {String(errors.name.message)}
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-1 block">{t('productForm.fields.description')} *</Label>
                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={(html) => field.onChange(html)}
                      placeholder={t('productForm.placeholders.description')}
                    />
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-destructive">
                    {String(errors.description.message)}
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-1 block">{t('productForm.fields.composition')}</Label>
                <Controller
                  control={control}
                  name="composition"
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={(html) => field.onChange(html)}
                      placeholder={t('productForm.placeholders.composition')}
                    />
                  )}
                />
                {errors.composition && (
                  <p className="mt-1 text-sm text-destructive">
                    {String(errors.composition.message)}
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-1 block">{t('productForm.fields.slug')}</Label>
                <Controller
                  control={control}
                  name="slug"
                  render={({ field }) => (
                    <Input
                      value={field.value || ''}
                      onChange={(e) => {
                        slugTouched.current = true;
                        field.onChange(slugifyLive(e.target.value));
                      }}
                      placeholder={t('productForm.placeholders.slug')}
                    />
                  )}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('productForm.hints.slug')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>{t('productForm.sections.pricing')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label className="mb-1 block">{t('productForm.fields.price')} *</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="1999"
                  {...register('price', { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-destructive">
                    {String(errors.price.message)}
                  </p>
                )}
              </div>
              <div>
                <Label className="mb-1 block">{t('productForm.fields.salePrice')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="1499"
                  {...register('salePrice', {
                    setValueAs: (v) =>
                      v === '' || v === null || v === undefined
                        ? null
                        : Number(v),
                  })}
                />
                {errors.salePrice && (
                  <p className="mt-1 text-sm text-destructive">
                    {String(errors.salePrice.message)}
                  </p>
                )}
              </div>
              <div>
                <Label className="mb-1 block">{t('productForm.fields.baseUnit')}</Label>
                <Input {...register('baseUnit')} placeholder="piece" />
                {errors.baseUnit && (
                  <p className="mt-1 text-sm text-destructive">
                    {String(errors.baseUnit.message)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Wholesale quantity pricing ("оптова ціна за кількість") */}
          <Card>
            <CardHeader>
              <CardTitle>{t('productForm.sections.wholesale')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('productForm.wholesale.description')}
              </p>

              {tierArray.fields.length === 0 && (
                <p className="text-sm italic text-muted-foreground">
                  {t('productForm.wholesale.empty')}
                </p>
              )}

              {tierArray.fields.map((field, index) => {
                const q = Number(watchedTiers?.[index]?.minQty) || 0;
                const p = Number(watchedTiers?.[index]?.price) || 0;
                const perUnit = q > 0 && p > 0 ? p / q : 0;
                return (
                  <div key={field.id} className="flex flex-wrap items-end gap-3">
                    <div className="w-32">
                      <Label className="mb-1 block">
                        {t('productForm.wholesale.minQty')}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="50"
                        {...register(`wholesaleTiers.${index}.minQty` as const, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="w-40">
                      <Label className="mb-1 block">
                        {t('productForm.wholesale.price')}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="22000"
                        {...register(`wholesaleTiers.${index}.price` as const, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <p className="min-w-[120px] flex-1 pb-2 text-sm text-muted-foreground">
                      {perUnit > 0 &&
                        t('productForm.wholesale.perUnit', {
                          value: (perUnit / 100).toFixed(2),
                        })}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => tierArray.remove(index)}
                      aria-label={t('productForm.wholesale.remove')}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  tierArray.append({
                    minQty: '' as unknown as number,
                    price: '' as unknown as number,
                  })
                }
              >
                <Plus className="size-4" />
                {t('productForm.wholesale.addTier')}
              </Button>
            </CardContent>
          </Card>

          {/* Stock — dual mode */}
          <Card>
            <CardHeader>
              <CardTitle>{t('productForm.sections.stock')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={trackQuantity ? 'quantity' : 'availability'}
                onValueChange={(v) =>
                  setValue('trackQuantity', v === 'quantity', {
                    shouldDirty: true,
                  })
                }
              >
                <TabsList className="grid w-full max-w-sm grid-cols-2">
                  <TabsTrigger value="quantity">{t('productForm.stock.quantityTab')}</TabsTrigger>
                  <TabsTrigger value="availability">{t('productForm.stock.availabilityTab')}</TabsTrigger>
                </TabsList>

                {/* Mode A: numeric quantity */}
                <TabsContent value="quantity" className="pt-4">
                  <Label className="mb-1 block">{t('productForm.stock.quantityLabel')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    className="max-w-xs"
                    {...register('quantity', { valueAsNumber: true })}
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-destructive">
                      {String(errors.quantity.message)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('productForm.stock.quantityHint')}
                  </p>
                </TabsContent>

                {/* Mode B: in/out-of-stock flag */}
                <TabsContent value="availability" className="pt-4">
                  <Controller
                    control={control}
                    name="isAvailable"
                    render={({ field }) => (
                      <label className="flex items-center gap-3">
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                        <span className="text-sm">
                          {field.value
                            ? t('productForm.stock.inStock')
                            : t('productForm.stock.outOfStock')}
                        </span>
                      </label>
                    )}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('productForm.stock.availabilityHint')}
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Attributes */}
          <Card>
            <CardHeader>
              <CardTitle>{t('productForm.sections.attributes')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductAttributeFields
                categoryId={categoryId}
                value={attributeValues}
                onChange={(vals) =>
                  setValue('attributeValues', vals, { shouldDirty: true })
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column — organization, media, keywords */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t('productForm.sections.organization')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-1 block">{t('productForm.fields.category')} *</Label>
                <CategoryPicker
                  value={categoryId || undefined}
                  onChange={handleCategoryChange}
                  placeholder={t('productForm.placeholders.category')}
                />
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-destructive">
                    {String(errors.categoryId.message)}
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-1 block">{t('productForm.fields.manufacturer')}</Label>
                <Input
                  {...register('manufacturer')}
                  placeholder={t('productForm.placeholders.manufacturer')}
                />
              </div>

              <div>
                <Label className="mb-1 block">{t('productForm.fields.brand')}</Label>
                <Controller
                  control={control}
                  name="brandId"
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(v) => field.onChange(v || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('productForm.placeholders.brand')} />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label className="mb-1 block">{t('productForm.fields.status')} *</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      value={field.value || 'DRAFT'}
                      onValueChange={(v) =>
                        field.onChange(v as ProductFormData['status'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">{t('productForm.status.draft')}</SelectItem>
                        <SelectItem value="ACTIVE">{t('productForm.status.active')}</SelectItem>
                        <SelectItem value="ARCHIVED">{t('productForm.status.archived')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('productForm.sections.images')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageManager
                images={images || []}
                onChange={(next) =>
                  setValue('images', next, { shouldDirty: true })
                }
                maxFiles={10}
              />
              {errors.images && (
                <p className="mt-1 text-sm text-destructive">
                  {String(errors.images.message)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('productForm.sections.keywords')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="searchKeywords"
                render={({ field }) => (
                  <KeywordsInput
                    value={field.value ?? []}
                    onChange={field.onChange}
                    disabled
                    placeholder={t('productForm.placeholders.keywords')}
                  />
                )}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t bg-background p-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/products')}
          disabled={isSubmitting}
        >
          {t('productForm.actions.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('productForm.actions.saving')
            : isEdit
              ? t('productForm.actions.update')
              : t('productForm.actions.create')}
        </Button>
      </div>
    </form>
  );
}
