'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { CreateMethodForm } from './create-method-form';

interface MethodSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneId: string;
  onSuccess: () => void;
}

export function MethodSheet({ open, onOpenChange, zoneId, onSuccess }: MethodSheetProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Shipping Method</SheetTitle>
          <SheetDescription>
            Fill in the details to add a new shipping method to this zone.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <CreateMethodForm zoneId={zoneId} onSuccess={handleSuccess} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
