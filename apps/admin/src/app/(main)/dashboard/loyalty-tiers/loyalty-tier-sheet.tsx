'use client';

import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import LoyaltyTierForm from './loyalty-tier-form';
import type { LoyaltyTier } from '@repo/types';

interface LoyaltyTierSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier?: LoyaltyTier | null;
  onSuccess: () => void;
}

export function LoyaltyTierSheet({ open, onOpenChange, tier, onSuccess }: LoyaltyTierSheetProps) {
  const { t } = useTranslation();
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{tier ? t('loyaltyTiers.sheet.editTitle') : t('loyaltyTiers.sheet.createTitle')}</SheetTitle>
          <SheetDescription>
            {tier ? t('loyaltyTiers.sheet.editDescription') : t('loyaltyTiers.sheet.createDescription')}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <LoyaltyTierForm tier={tier || undefined} onSuccess={handleSuccess} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
