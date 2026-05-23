'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  metaTitle: z.string().max(60, 'Meta title must be 60 characters or less').optional(),
  metaDescription: z.string().max(160, 'Meta description must be 160 characters or less').optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category?: Category;
  categories: Category[];
  onSuccess?: () => void;
}

export default function CategoryForm({ category, categories, onSuccess }: CategoryFormProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

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
      const autoSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', autoSlug);
    }
  }, [name, category, slugManuallyEdited, setValue]);

  // Filter out current category and its descendants from parent options (for edit mode)
  const getDescendantIds = (catId: string): string[] => {
    const descendants = categories.filter((c) => c.parentId === catId);
    return [
      catId,
      ...descendants.flatMap((d) => getDescendantIds(d.id)),
    ];
  };

  const availableParents = category
    ? categories.filter((c) => !getDescendantIds(category.id).includes(c.id))
    : categories;

  const onSubmit = async (data: CategoryFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError('Not authenticated');
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
      setError(err.message || 'Failed to save category');
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
          Name *
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
          Description
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
          Parent Category
        </Label>
        <Select value={watch('parentId') || 'none'} onValueChange={(v) => setValue('parentId', v === 'none' ? null : v)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="None (Root Category)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (Root Category)</SelectItem>
            {availableParents.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {'\u2014'.repeat(cat.depth)} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.parentId && (
          <p className="text-sm text-red-600 mt-1">{String(errors.parentId.message)}</p>
        )}
      </div>

      {/* Image */}
      <div>
        <Label className="mb-1">
          Image
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
        <h3 className="text-lg font-semibold mb-3">SEO Settings</h3>

        {/* Slug */}
        <div className="mb-4">
          <Label htmlFor="slug" className="mb-1">
            URL Slug
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
              Preview: /categories/{slug}
            </p>
          )}
          {errors.slug && (
            <p className="text-sm text-red-600 mt-1">{String(errors.slug.message)}</p>
          )}
        </div>

        {/* Meta Title */}
        <div className="mb-4">
          <Label htmlFor="metaTitle" className="mb-1">
            Meta Title
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
            Meta Description
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
          {isLoading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/categories')}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
