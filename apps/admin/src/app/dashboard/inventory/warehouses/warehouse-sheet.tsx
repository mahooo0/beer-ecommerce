'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { WarehouseForm } from './warehouse-form';

interface WarehouseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: any;
  onSuccess: () => void;
}

export function WarehouseSheet({ open, onOpenChange, warehouse, onSuccess }: WarehouseSheetProps) {
  const handleSave = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{warehouse ? 'Edit Warehouse' : 'Create New Warehouse'}</SheetTitle>
          <SheetDescription>
            {warehouse ? 'Update the warehouse details below.' : 'Fill in the details to create a new warehouse.'}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <WarehouseForm
            warehouse={warehouse}
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
