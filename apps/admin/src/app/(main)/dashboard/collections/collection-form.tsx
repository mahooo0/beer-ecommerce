'use client';

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import type { Collection } from '@repo/types';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const buildCollectionSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('collections.errors.nameRequired')),
    description: z.string().optional(),
    image: z.string().url(t('collections.errors.urlInvalid')).optional().or(z.literal('')),
    slug: z.string().min(1, t('collections.errors.slugRequired')),
    isActive: z.boolean().default(true),
  });

type CollectionFormData = z.infer<ReturnType<typeof buildCollectionSchema>>;

interface CollectionFormProps {
  collection?: Collection;
  onSuccess: () => void;
}

export default function CollectionForm({ collection, onSuccess }: CollectionFormProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const collectionSchema = useMemo(() => buildCollectionSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: collection?.name || '',
      description: collection?.description || '',
      image: collection?.image || '',
      slug: collection?.slug || '',
      isActive: collection?.isActive ?? true,
    },
  });

  const name = watch('name');

  // Auto-generate slug from name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    if (!collection) {
      // Only auto-generate slug for new collections
      setValue('slug', generateSlug(newName));
    }
  };

  const onSubmit = async (data: CollectionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error(t('collections.errors.notAuth'));
      }

      if (collection) {
        await api.collections.update(collection.id, data, token);
      } else {
        await api.collections.create(data, token);
      }

      router.refresh();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('collections.errors.saveFailed'));
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
          {t('collections.form.name')} <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          id="name"
          {...register('name', {
            onChange: handleNameChange,
          })}
          placeholder={t('collections.form.namePlaceholder')}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{String(errors.name.message)}</p>
        )}
      </div>

      <div>
        <Label htmlFor="slug" className="mb-1">
          {t('collections.form.slug')} <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          id="slug"
          {...register('slug')}
          placeholder={t('collections.form.slugPlaceholder')}
        />
        {errors.slug && (
          <p className="mt-1 text-sm text-red-600">{String(errors.slug.message)}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description" className="mb-1">
          {t('collections.form.description')}
        </Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder={t('collections.form.descriptionPlaceholder')}
        />
      </div>

      <div>
        <Label className="mb-1">
          {t('collections.form.image')}
        </Label>
        <ImageUpload
          value={watch('image') || ''}
          onChange={(val) => setValue('image', val as string, { shouldValidate: true })}
          preset="collection"
        />
        {errors.image && (
          <p className="mt-1 text-sm text-red-600">{String(errors.image.message)}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={watch('isActive')}
          onCheckedChange={(checked) => setValue('isActive', !!checked)}
        />
        <Label htmlFor="isActive" className="text-sm">
          {t('collections.form.active')}
        </Label>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? t('collections.form.saving')
            : collection
              ? t('collections.form.update')
              : t('collections.form.create')}
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard/collections">{t('collections.form.cancel')}</a>
        </Button>
      </div>
    </form>
  );
}
