'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import type { Category } from '@repo/types';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryEditForm } from '@/components/category/category-edit-form';
import { AttributeSection } from '@/components/category/attribute-section';
import { FilterSection } from '@/components/category/filter-section';

/**
 * Category detail / edit page.
 *
 * Route: /dashboard/categories/[id]. IDs are cuid strings. Renders three
 * things: the main edit form (name/slug/description/parent/image/SEO/order),
 * the structured "Атрибути" panel (create/edit/delete attributes + their common
 * options, drag-reorder), and the manual "Фільтри категорії" panel.
 *
 * The category itself is fetched here; attributes and filters load inside their
 * own sections via lib/queries/{attributes,filters}. This is a client component
 * so all the interactive react-query panels share the same provider.
 *
 * Ported from 4fr-ecom's categories/[id]/page.tsx, decomposed into
 * components/category/* and adapted to taranka's API + string ids.
 */
export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useTranslation();
  const { id } = use(params);

  const {
    data: category,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['categories', 'detail', id],
    queryFn: async () => {
      const res = await api.categories.getById(id);
      return res.data as Category;
    },
    enabled: !!id,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        {t('categoryPage.detail.errorPrefix')}: {error instanceof Error ? error.message : t('categoryPage.detail.loadFailed')}
      </div>
    );
  }

  if (!category) {
    return <div className="p-8 text-center">{t('categoryPage.detail.notFound')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-md bg-secondary px-4 py-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/dashboard/categories" aria-label={t('categoryPage.detail.backToCategories')}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-semibold">{t('categoryPage.detail.editTitle', { name: category.name })}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main edit form */}
        <div className="rounded-md border bg-background p-6 lg:col-span-2">
          <CategoryEditForm key={category.id} category={category} />
        </div>

        {/* Sidebar: structured attributes + manual filters */}
        <div className="space-y-4">
          <div className="space-y-4 rounded-md border bg-background p-4">
            <h2 className="text-sm font-semibold">{t('categoryPage.detail.attributesHeading')}</h2>
            <AttributeSection categoryId={category.id} />
          </div>

          <div className="space-y-4 rounded-md border bg-background p-4">
            <h2 className="text-sm font-semibold">{t('categoryPage.detail.filtersHeading')}</h2>
            <FilterSection categoryId={category.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
