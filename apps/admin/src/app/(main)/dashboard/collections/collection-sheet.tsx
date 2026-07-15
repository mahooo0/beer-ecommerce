'use client';

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
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{collection ? 'Edit Collection' : 'Create Collection'}</SheetTitle>
          <SheetDescription>
            {collection ? 'Update the collection details below.' : 'Fill in the details to create a new collection.'}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <CollectionForm collection={collection || undefined} onSuccess={handleSuccess} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
