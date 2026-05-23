'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import CategoryForm from './category-form';
import type { Category } from '@repo/types';

interface CategorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  categories: Category[];
  onSuccess: () => void;
}

export function CategorySheet({ open, onOpenChange, category, categories, onSuccess }: CategorySheetProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{category ? 'Edit Category' : 'Create Category'}</SheetTitle>
          <SheetDescription>
            {category ? 'Update the category details below.' : 'Fill in the details to create a new category.'}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <CategoryForm category={category || undefined} categories={categories} onSuccess={handleSuccess} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
