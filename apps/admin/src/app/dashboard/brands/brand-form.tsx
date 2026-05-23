'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Brand } from '@repo/types';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const brandSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  logo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  slug: z.string().min(1, 'Slug is required'),
});

type BrandFormData = z.infer<typeof brandSchema>;

interface BrandFormProps {
  brand?: Brand;
  onSuccess: () => void;
}

export default function BrandForm({ brand, onSuccess }: BrandFormProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        throw new Error('Not authenticated');
      }

      if (brand) {
        await api.brands.update(brand.id, data, token);
      } else {
        await api.brands.create(data, token);
      }

      router.refresh();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brand');
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
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          id="name"
          {...register('name', {
            onChange: handleNameChange,
          })}
          placeholder="Nike"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{String(errors.name.message)}</p>
        )}
      </div>

      <div>
        <Label htmlFor="slug" className="mb-1">
          Slug <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          id="slug"
          {...register('slug')}
          placeholder="nike"
        />
        {errors.slug && (
          <p className="mt-1 text-sm text-red-600">{String(errors.slug.message)}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description" className="mb-1">
          Description
        </Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder="A leading sports brand"
        />
      </div>

      <div>
        <Label className="mb-1">
          Logo
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
          Website
        </Label>
        <Input
          type="text"
          id="website"
          {...register('website')}
          placeholder="https://example.com"
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
          {isSubmitting ? 'Saving...' : brand ? 'Update Brand' : 'Create Brand'}
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard/brands">Cancel</a>
        </Button>
      </div>
    </form>
  );
}
