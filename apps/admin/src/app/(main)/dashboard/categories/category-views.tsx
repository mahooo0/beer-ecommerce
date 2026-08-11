'use client';

import type { Category } from '@repo/types';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoryTree from './category-tree';
import CategoryTable from './category-table';

interface CategoryViewsProps {
  categories: Category[];
  onEditCategory?: (category: Category) => void;
}

export default function CategoryViews({ categories, onEditCategory }: CategoryViewsProps) {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="tree">
      <TabsList>
        <TabsTrigger value="tree">{t('categoryPage.views.tree')}</TabsTrigger>
        <TabsTrigger value="table">{t('categoryPage.views.table')}</TabsTrigger>
      </TabsList>
      <TabsContent value="tree">
        <CategoryTree categories={categories} onEditCategory={onEditCategory} />
      </TabsContent>
      <TabsContent value="table">
        <CategoryTable categories={categories} onEditCategory={onEditCategory} />
      </TabsContent>
    </Tabs>
  );
}
