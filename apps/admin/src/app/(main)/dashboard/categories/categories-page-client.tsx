'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { Category } from '@repo/types';
import { Button } from '@/components/ui/button';
import { DataTableFilters, type FilterConfig } from '@/components/DataTableFilters';
import CategoryViews from './category-views';
import { CategorySheet } from './category-sheet';

function filterCategoryTree(categories: Category[], search: string): Category[] {
  if (!search) return categories;
  const lower = search.toLowerCase();
  return categories.reduce<Category[]>((acc, cat) => {
    const catAny = cat as any;
    const children = catAny.children ? filterCategoryTree(catAny.children as Category[], search) : [];
    if (cat.name.toLowerCase().includes(lower) || children.length > 0) {
      acc.push({ ...cat, ...(children.length > 0 ? { children } : {}) } as Category);
    }
    return acc;
  }, []);
}

interface CategoriesPageClientProps {
  categories: Category[];
}

export function CategoriesPageClient({ categories }: CategoriesPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({ search: '' });

  const categoryFilterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'search',
        label: t('categories.searchLabel'),
        type: 'search',
        placeholder: t('categories.searchPlaceholder'),
      },
    ],
    [t],
  );

  const filteredCategories = useMemo(() => {
    return filterCategoryTree(categories, filterValues.search as string || '');
  }, [categories, filterValues.search]);

  const handleSuccess = () => {
    setSheetOpen(false);
    setEditingCategory(null);
    router.refresh();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setSheetOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
        <Button onClick={handleCreate}>
          {t('categories.add')}
        </Button>
      </div>

      <DataTableFilters
        filters={categoryFilterConfigs}
        values={filterValues}
        onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
        onReset={() => setFilterValues({ search: '' })}
      />

      <div className="bg-card rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">{t('categories.hierarchy')}</h2>
        <CategoryViews categories={filteredCategories} onEditCategory={handleEdit} />
      </div>

      <CategorySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        category={editingCategory}
        categories={categories}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
