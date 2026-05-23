'use client';

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
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{brand ? 'Edit Brand' : 'Create Brand'}</SheetTitle>
          <SheetDescription>
            {brand ? 'Update the brand details below.' : 'Fill in the details to create a new brand.'}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <BrandForm brand={brand || undefined} onSuccess={handleSuccess} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
