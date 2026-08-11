'use client';

import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import BrandForm from './brand-form';
import type { Brand } from '@repo/types';

interface BrandSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand | null;
  onSuccess: () => void;
}

export function BrandSheet({ open, onOpenChange, brand, onSuccess }: BrandSheetProps) {
  const { t } = useTranslation();
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{brand ? t('brands.sheet.editTitle') : t('brands.sheet.createTitle')}</SheetTitle>
          <SheetDescription>
            {brand ? t('brands.sheet.editDescription') : t('brands.sheet.createDescription')}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <BrandForm brand={brand || undefined} onSuccess={handleSuccess} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
