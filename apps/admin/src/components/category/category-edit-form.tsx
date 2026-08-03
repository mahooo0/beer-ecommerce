'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import type { Category } from '@repo/types';

import { api } from '@/lib/api';
import { slugify, slugifyLive } from '@/lib/slug';
import { showError, showSuccess } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CategoryPicker from '@/components/CategoryPicker';
import SingleImageUpload from '@/components/category/single-image-upload';

// taranka's Category has a single `image` field (no separate icon/banner
// columns) and the update endpoint accepts only these fields — parent change
// goes through the dedicated /move route, so it's handled separately below.
const editSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова").max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Лише малі літери, цифри та дефіси')
    .min(1, "Slug обов'язковий"),
  description: z.string().optional(),
  image: z.string().url('Некоректний URL').optional().or(z.literal('')),
  metaTitle: z.string().max(60, 'Максимум 60 символів').optional(),
  metaDescription: z.string().max(160, 'Максимум 160 символів').optional(),
  position: z.number().int().min(0),
});

type EditFormData = z.infer<typeof editSchema>;

interface CategoryEditFormProps {
  category: Category;
}

/**
 * The main edit form on the category detail page. Ported from 4fr-ecom's
 * CategoryEditForm and adapted to taranka's Category shape + API:
 *  - slug gets live-transliteration while typing and a clean re-slugify on blur;
 *  - the single `image` field is edited through SingleImageUpload;
 *  - the parent select uses the existing CategoryPicker and persists through the
 *    dedicated /move endpoint (the update endpoint doesn't accept parentId).
 */
export function CategoryEditForm({ category }: CategoryEditFormProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [parentId, setParentId] = useState<string | null>(category.parentId ?? null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      image: category.image ?? '',
      metaTitle: category.metaTitle ?? '',
      metaDescription: category.metaDescription ?? '',
      position: category.position ?? 0,
    },
  });

  const slug = watch('slug');
  const image = watch('image');
  const metaTitle = watch('metaTitle');
  const metaDescription = watch('metaDescription');

  const mutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      const token = await getToken();
      if (!token) throw new Error('Не автентифіковано');

      // 1) Persist the editable fields. Drop an empty image so the URL check
      //    on the server doesn't reject "".
      const { image: img, ...rest } = data;
      await api.categories.update(
        category.id,
        { ...rest, ...(img ? { image: img } : { image: undefined }) },
        token,
      );

      // 2) If the parent changed, move the category through the dedicated route
      //    (the update endpoint intentionally doesn't accept parentId).
      if ((parentId ?? null) !== (category.parentId ?? null)) {
        await api.categories.move(
          category.id,
          { newParentId: parentId, position: 0 },
          token,
        );
      }
    },
    onSuccess: () => {
      showSuccess('Категорію оновлено');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => showError(err instanceof Error ? err.message : 'Помилка збереження'),
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cat-name" className="mb-1">
            Назва
          </Label>
          <Input id="cat-name" {...register('name')} />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="cat-slug" className="mb-1">
            Slug
          </Label>
          <Input
            id="cat-slug"
            {...register('slug')}
            onChange={(e) =>
              setValue('slug', slugifyLive(e.target.value), { shouldValidate: true })
            }
            onBlur={(e) =>
              setValue('slug', slugify(e.target.value), { shouldValidate: true })
            }
          />
          {slug && (
            <p className="mt-1 text-xs text-muted-foreground">/categories/{slug}</p>
          )}
          {errors.slug && (
            <p className="mt-1 text-sm text-destructive">{errors.slug.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="cat-description" className="mb-1">
          Опис
        </Label>
        <Textarea id="cat-description" rows={3} {...register('description')} />
      </div>

      <div>
        <Label className="mb-1">Батьківська категорія</Label>
        <CategoryPicker
          value={parentId}
          onChange={setParentId}
          allowNone
          noneLabel="Немає (коренева категорія)"
          placeholder="Немає (коренева категорія)"
          excludeSubtreeId={category.id}
        />
      </div>

      <div>
        <Label className="mb-1">Зображення категорії</Label>
        <SingleImageUpload
          value={image || null}
          onChange={(url) => setValue('image', url ?? '', { shouldValidate: true })}
          preset="category"
        />
        {errors.image && (
          <p className="mt-1 text-sm text-destructive">{errors.image.message}</p>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="mb-3 text-sm font-semibold">SEO</h3>
        <div className="mb-4">
          <Label htmlFor="cat-meta-title" className="mb-1">
            Meta Title
            <span className="ml-2 text-xs text-muted-foreground">
              ({metaTitle?.length || 0}/60)
            </span>
          </Label>
          <Input id="cat-meta-title" maxLength={60} {...register('metaTitle')} />
          {errors.metaTitle && (
            <p className="mt-1 text-sm text-destructive">{errors.metaTitle.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="cat-meta-desc" className="mb-1">
            Meta Description
            <span className="ml-2 text-xs text-muted-foreground">
              ({metaDescription?.length || 0}/160)
            </span>
          </Label>
          <Textarea
            id="cat-meta-desc"
            rows={2}
            maxLength={160}
            {...register('metaDescription')}
          />
          {errors.metaDescription && (
            <p className="mt-1 text-sm text-destructive">{errors.metaDescription.message}</p>
          )}
        </div>
      </div>

      <div className="max-w-40">
        <Label htmlFor="cat-position" className="mb-1">
          Порядок сортування
        </Label>
        <Input
          id="cat-position"
          type="number"
          {...register('position', { valueAsNumber: true })}
        />
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mutation.isPending ? 'Збереження…' : 'Зберегти зміни'}
      </Button>
    </form>
  );
}
