'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Category } from '@repo/types';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CategoryPicker from '@/components/CategoryPicker';
import { slugify } from '@/lib/slugify';

const buildCategoryFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('categories.form.errors.nameRequired')).max(100, t('categories.form.errors.nameMax')),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
    image: z.string().url(t('categories.form.errors.urlInvalid')).optional().or(z.literal('')),
    metaTitle: z.string().max(60, t('categories.form.errors.metaTitleMax')).optional(),
    metaDescription: z.string().max(160, t('categories.form.errors.metaDescMax')).optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, t('categories.form.errors.slugInvalid'))
      .optional(),
  });

type CategoryFormData = z.infer<ReturnType<typeof buildCategoryFormSchema>>;

interface CategoryFormProps {
  category?: Category;
  categories: Category[];
  onSuccess?: () => void;
}

export default function CategoryForm({ category, categories, onSuccess }: CategoryFormProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const categoryFormSchema = useMemo(() => buildCategoryFormSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      parentId: category?.parentId || null,
      image: category?.image || '',
      metaTitle: category?.metaTitle || '',
      metaDescription: category?.metaDescription || '',
      slug: category?.slug || '',
    },
  });

  const name = watch('name');
  const slug = watch('slug');
  const metaTitle = watch('metaTitle');
  const metaDescription = watch('metaDescription');

  // Auto-generate slug from name (only on create, and if slug hasn't been manually edited)
  useEffect(() => {
    if (!category && name && !slugManuallyEdited) {
      setValue('slug', slugify(name));
    }
  }, [name, category, slugManuallyEdited, setValue]);

  const onSubmit = async (data: CategoryFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError(t('categories.form.errors.notAuth'));
        return;
      }

      if (category) {
        // Update existing category
        await api.categories.update(category.id, data as any, token);
      } else {
        // Create new category
        await api.categories.create(data as any, token);
      }

      // Refresh the page and close the form
      if (onSuccess) {
        router.refresh();
        onSuccess();
      } else {
        router.push('/dashboard/categories');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || t('categories.form.errors.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <Label htmlFor="name" className="mb-1">
          {t('categories.form.name')} *
        </Label>
        <Input
          {...register('name')}
          id="name"
          type="text"
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{String(errors.name.message)}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="mb-1">
          {t('categories.form.description')}
        </Label>
        <Textarea
          {...register('description')}
          id="description"
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{String(errors.description.message)}</p>
        )}
      </div>

      {/* Parent Category */}
      <div>
        <Label htmlFor="parentId" className="mb-1">
          {t('categories.form.parent')}
        </Label>
        <CategoryPicker
          value={watch('parentId') ?? null}
          onChange={(id) => setValue('parentId', id, { shouldValidate: true })}
          allowNone
          noneLabel={t('categories.form.none')}
          placeholder={t('categories.form.none')}
          excludeSubtreeId={category?.id}
        />
        {errors.parentId && (
          <p className="text-sm text-red-600 mt-1">{String(errors.parentId.message)}</p>
        )}
      </div>

      {/* Image */}
      <div>
        <Label className="mb-1">
          {t('categories.form.image')}
        </Label>
        <ImageUpload
          value={watch('image') || ''}
          onChange={(val) => setValue('image', val as string, { shouldValidate: true })}
          preset="category"
        />
        {errors.image && (
          <p className="text-sm text-red-600 mt-1">{String(errors.image.message)}</p>
        )}
      </div>

      {/* SEO Section */}
      <div className="border-t pt-4 mt-6">
        <h3 className="text-lg font-semibold mb-3">{t('categories.form.seo')}</h3>

        {/* Slug */}
        <div className="mb-4">
          <Label htmlFor="slug" className="mb-1">
            {t('categories.form.slug')}
          </Label>
          <Input
            {...register('slug')}
            id="slug"
            type="text"
            onChange={(e) => {
              setSlugManuallyEdited(true);
              register('slug').onChange(e);
            }}
          />
          {slug && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('categories.form.slugPreview', { slug })}
            </p>
          )}
          {errors.slug && (
            <p className="text-sm text-red-600 mt-1">{String(errors.slug.message)}</p>
          )}
        </div>

        {/* Meta Title */}
        <div className="mb-4">
          <Label htmlFor="metaTitle" className="mb-1">
            {t('categories.form.metaTitle')}
            <span className="text-xs text-muted-foreground ml-2">
              ({metaTitle?.length || 0}/60)
            </span>
          </Label>
          <Input
            {...register('metaTitle')}
            id="metaTitle"
            type="text"
            maxLength={60}
          />
          {errors.metaTitle && (
            <p className="text-sm text-red-600 mt-1">{String(errors.metaTitle.message)}</p>
          )}
        </div>

        {/* Meta Description */}
        <div>
          <Label htmlFor="metaDescription" className="mb-1">
            {t('categories.form.metaDescription')}
            <span className="text-xs text-muted-foreground ml-2">
              ({metaDescription?.length || 0}/160)
            </span>
          </Label>
          <Textarea
            {...register('metaDescription')}
            id="metaDescription"
            rows={2}
            maxLength={160}
          />
          {errors.metaDescription && (
            <p className="text-sm text-red-600 mt-1">{String(errors.metaDescription.message)}</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading
            ? t('categories.form.saving')
            : category
              ? t('categories.form.update')
              : t('categories.form.create')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/categories')}
          disabled={isLoading}
        >
          {t('categories.form.cancel')}
        </Button>
      </div>
    </form>
  );
}
