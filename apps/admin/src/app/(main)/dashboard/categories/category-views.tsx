'use client';

import type { Category } from '@repo/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoryTree from './category-tree';
import CategoryTable from './category-table';

interface CategoryViewsProps {
  categories: Category[];
  onEditCategory?: (category: Category) => void;
}

export default function CategoryViews({ categories, onEditCategory }: CategoryViewsProps) {
  return (
    <Tabs defaultValue="tree">
      <TabsList>
        <TabsTrigger value="tree">Tree View</TabsTrigger>
        <TabsTrigger value="table">Table View</TabsTrigger>
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
