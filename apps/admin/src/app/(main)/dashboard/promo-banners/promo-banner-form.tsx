'use client';

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { PromoBanner } from '@repo/types';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import CategoryPicker from '@/components/CategoryPicker';
import type { ProductOption } from './promo-banners-page-client';

const buildSchema = (t: (key: string) => string) =>
  z.object({
    image: z.string().min(1, t('promoBanners.errors.imageRequired')),
    titlePl: z.string().optional(),
    titleUk: z.string().optional(),
    subtitlePl: z.string().optional(),
    subtitleUk: z.string().optional(),
    ctaPl: z.string().optional(),
    ctaUk: z.string().optional(),
    linkType: z.enum(['none', 'product', 'category', 'href']),
    productId: z.string().optional(),
    categoryId: z.string().optional(),
    href: z.string().optional(),
    isActive: z.boolean(),
    position: z.number().int().min(0),
  });

type FormData = z.infer<ReturnType<typeof buildSchema>>;

interface PromoBannerFormProps {
  banner?: PromoBanner;
  products: ProductOption[];
  onSuccess: () => void;
}

export default function PromoBannerForm({ banner, products, onSuccess }: PromoBannerFormProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => buildSchema(t), [t]);

  const initialLinkType: FormData['linkType'] = banner?.productId
    ? 'product'
    : banner?.categoryId
      ? 'category'
      : banner?.href
        ? 'href'
        : 'none';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      image: banner?.image || '',
      titlePl: banner?.title?.pl || '',
      titleUk: banner?.title?.uk || '',
      subtitlePl: banner?.subtitle?.pl || '',
      subtitleUk: banner?.subtitle?.uk || '',
      ctaPl: banner?.ctaLabel?.pl || '',
      ctaUk: banner?.ctaLabel?.uk || '',
      linkType: initialLinkType,
      productId: banner?.productId || '',
      categoryId: banner?.categoryId || '',
      href: banner?.href || '',
      isActive: banner?.isActive ?? true,
      position: banner?.position ?? 0,
    },
  });

  const linkType = watch('linkType');
  const image = watch('image');
  const isActive = watch('isActive');
  const categoryId = watch('categoryId');

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const token = await getToken();
      if (!token) throw new Error(t('promoBanners.errors.notAuth'));

      const payload = {
        image: data.image,
        title: { pl: data.titlePl || '', uk: data.titleUk || '' },
        subtitle: { pl: data.subtitlePl || '', uk: data.subtitleUk || '' },
        ctaLabel: { pl: data.ctaPl || '', uk: data.ctaUk || '' },
        productId: data.linkType === 'product' ? data.productId || null : null,
        categoryId: data.linkType === 'category' ? data.categoryId || null : null,
        href: data.linkType === 'href' ? data.href || null : null,
        isActive: data.isActive,
        position: data.position,
      };

      if (banner) {
        await api.promoBanners.update(banner.id, payload, token);
      } else {
        await api.promoBanners.create(payload, token);
      }

      router.refresh();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('promoBanners.errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Image */}
      <div>
        <Label className="mb-1">
          {t('promoBanners.form.image')} <span className="text-red-500">*</span>
        </Label>
        <ImageUpload
          value={image || ''}
          onChange={(val) => setValue('image', Array.isArray(val) ? val[0] || '' : val, { shouldValidate: true })}
          preset="collection"
        />
        {errors.image && <p className="mt-1 text-sm text-red-600">{String(errors.image.message)}</p>}
      </div>

      {/* Title (pl / uk) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="titlePl" className="mb-1">{t('promoBanners.form.titlePl')}</Label>
          <Input id="titlePl" {...register('titlePl')} placeholder={t('promoBanners.form.titlePlaceholder')} />
        </div>
        <div>
          <Label htmlFor="titleUk" className="mb-1">{t('promoBanners.form.titleUk')}</Label>
          <Input id="titleUk" {...register('titleUk')} placeholder={t('promoBanners.form.titlePlaceholder')} />
        </div>
      </div>

      {/* Subtitle (pl / uk) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="subtitlePl" className="mb-1">{t('promoBanners.form.subtitlePl')}</Label>
          <Textarea id="subtitlePl" rows={2} {...register('subtitlePl')} placeholder={t('promoBanners.form.subtitlePlaceholder')} />
        </div>
        <div>
          <Label htmlFor="subtitleUk" className="mb-1">{t('promoBanners.form.subtitleUk')}</Label>
          <Textarea id="subtitleUk" rows={2} {...register('subtitleUk')} placeholder={t('promoBanners.form.subtitlePlaceholder')} />
        </div>
      </div>

      {/* CTA label (pl / uk) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="ctaPl" className="mb-1">{t('promoBanners.form.ctaPl')}</Label>
          <Input id="ctaPl" {...register('ctaPl')} placeholder={t('promoBanners.form.ctaPlaceholder')} />
        </div>
        <div>
          <Label htmlFor="ctaUk" className="mb-1">{t('promoBanners.form.ctaUk')}</Label>
          <Input id="ctaUk" {...register('ctaUk')} placeholder={t('promoBanners.form.ctaPlaceholder')} />
        </div>
      </div>

      {/* Link target */}
      <div>
        <Label htmlFor="linkType" className="mb-1">{t('promoBanners.form.linkType')}</Label>
        <NativeSelect className="w-full">
          <select
            id="linkType"
            className="h-8 w-full appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm outline-none"
            value={linkType}
            onChange={(e) => setValue('linkType', e.target.value as FormData['linkType'])}
          >
            <option value="none">{t('promoBanners.form.linkNone')}</option>
            <option value="product">{t('promoBanners.form.linkProduct')}</option>
            <option value="category">{t('promoBanners.form.linkCategory')}</option>
            <option value="href">{t('promoBanners.form.linkHref')}</option>
          </select>
        </NativeSelect>
      </div>

      {linkType === 'product' && (
        <div>
          <Label htmlFor="productId" className="mb-1">{t('promoBanners.form.product')}</Label>
          <NativeSelect className="w-full">
            <select
              id="productId"
              className="h-8 w-full appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm outline-none"
              value={watch('productId') || ''}
              onChange={(e) => setValue('productId', e.target.value)}
            >
              <NativeSelectOption value="">{t('promoBanners.form.selectProduct')}</NativeSelectOption>
              {products.map((p) => (
                <NativeSelectOption key={p.id} value={p.id}>{p.name}</NativeSelectOption>
              ))}
            </select>
          </NativeSelect>
        </div>
      )}

      {linkType === 'category' && (
        <div>
          <Label className="mb-1">{t('promoBanners.form.category')}</Label>
          <CategoryPicker
            value={categoryId || undefined}
            onChange={(id) => setValue('categoryId', id || '')}
            placeholder={t('promoBanners.form.selectCategory')}
          />
        </div>
      )}

      {linkType === 'href' && (
        <div>
          <Label htmlFor="href" className="mb-1">{t('promoBanners.form.href')}</Label>
          <Input id="href" {...register('href')} placeholder="/products" />
        </div>
      )}

      {/* Active + position */}
      <div className="flex items-center gap-6 pt-2">
        <div className="flex items-center gap-2">
          <Switch id="isActive" checked={isActive} onCheckedChange={(v) => setValue('isActive', v)} />
          <Label htmlFor="isActive">{t('promoBanners.form.isActive')}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="position">{t('promoBanners.form.position')}</Label>
          <Input id="position" type="number" min={0} className="w-24" {...register('position', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('promoBanners.form.saving')
            : banner
              ? t('promoBanners.form.update')
              : t('promoBanners.form.create')}
        </Button>
      </div>
    </form>
  );
}
