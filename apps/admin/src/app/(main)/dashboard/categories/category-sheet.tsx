'use client';

import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{category ? t('categories.editTitle') : t('categories.createTitle')}</SheetTitle>
          <SheetDescription>
            {category ? t('categories.editDesc') : t('categories.createDesc')}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <CategoryForm category={category || undefined} categories={categories} onSuccess={handleSuccess} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
