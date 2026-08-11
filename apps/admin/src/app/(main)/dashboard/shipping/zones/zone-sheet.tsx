'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { CreateZoneForm } from './create-zone-form';
import type { ShippingZone } from '@repo/types';

interface ZoneSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone?: ShippingZone | null;
  onSuccess: () => void;
}

export function ZoneSheet({ open, onOpenChange, zone, onSuccess }: ZoneSheetProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{zone ? `Edit Zone: ${zone.name}` : 'Create New Zone'}</SheetTitle>
          <SheetDescription>
            {zone ? 'Update the zone details below.' : 'Configure a new shipping zone.'}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <CreateZoneForm onSuccess={handleSuccess} zone={zone} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
