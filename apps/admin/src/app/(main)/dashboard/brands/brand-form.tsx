'use client';

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Brand } from '@repo/types';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const buildBrandSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('brands.errors.nameRequired')),
    description: z.string().optional(),
    logo: z.string().url(t('brands.errors.urlInvalid')).optional().or(z.literal('')),
    website: z.string().url(t('brands.errors.urlInvalid')).optional().or(z.literal('')),
    slug: z.string().min(1, t('brands.errors.slugRequired')),
  });

type BrandFormData = z.infer<ReturnType<typeof buildBrandSchema>>;

interface BrandFormProps {
  brand?: Brand;
  onSuccess: () => void;
}

export default function BrandForm({ brand, onSuccess }: BrandFormProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brandSchema = useMemo(() => buildBrandSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name || '',
      description: brand?.description || '',
      logo: brand?.logo || '',
      website: brand?.website || '',
      slug: brand?.slug || '',
    },
  });

  // Auto-generate slug from name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    if (!brand) {
      // Only auto-generate slug for new brands
      setValue('slug', generateSlug(newName));
    }
  };

  const onSubmit = async (data: BrandFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error(t('brands.errors.notAuth'));
      }

      if (brand) {
        await api.brands.update(brand.id, data, token);
      } else {
        await api.brands.create(data, token);
      }

      router.refresh();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('brands.errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="name" className="mb-1">
          {t('brands.form.name')} <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          id="name"
          {...register('name', {
            onChange: handleNameChange,
          })}
          placeholder={t('brands.form.namePlaceholder')}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{String(errors.name.message)}</p>
        )}
      </div>

      <div>
        <Label htmlFor="slug" className="mb-1">
          {t('brands.form.slug')} <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          id="slug"
          {...register('slug')}
          placeholder={t('brands.form.slugPlaceholder')}
        />
        {errors.slug && (
          <p className="mt-1 text-sm text-red-600">{String(errors.slug.message)}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description" className="mb-1">
          {t('brands.form.description')}
        </Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder={t('brands.form.descriptionPlaceholder')}
        />
      </div>

      <div>
        <Label className="mb-1">
          {t('brands.form.logo')}
        </Label>
        <ImageUpload
          value={watch('logo') || ''}
          onChange={(val) => setValue('logo', val, { shouldValidate: true })}
          preset="brand"
        />
        {errors.logo && (
          <p className="mt-1 text-sm text-red-600">{String(errors.logo.message)}</p>
        )}
      </div>

      <div>
        <Label htmlFor="website" className="mb-1">
          {t('brands.form.website')}
        </Label>
        <Input
          type="text"
          id="website"
          {...register('website')}
          placeholder={t('brands.form.websitePlaceholder')}
        />
        {errors.website && (
          <p className="mt-1 text-sm text-red-600">{String(errors.website.message)}</p>
        )}
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('brands.form.saving') : brand ? t('brands.form.update') : t('brands.form.create')}
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard/brands">{t('brands.form.cancel')}</a>
        </Button>
      </div>
    </form>
  );
}
