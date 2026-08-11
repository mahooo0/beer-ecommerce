'use client';

import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import CollectionForm from './collection-form';
import type { Collection } from '@repo/types';

interface CollectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: Collection | null;
  onSuccess: () => void;
}

export function CollectionSheet({ open, onOpenChange, collection, onSuccess }: CollectionSheetProps) {
  const { t } = useTranslation();
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{collection ? t('collections.sheet.editTitle') : t('collections.sheet.createTitle')}</SheetTitle>
          <SheetDescription>
            {collection ? t('collections.sheet.editDescription') : t('collections.sheet.createDescription')}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <CollectionForm collection={collection || undefined} onSuccess={handleSuccess} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
