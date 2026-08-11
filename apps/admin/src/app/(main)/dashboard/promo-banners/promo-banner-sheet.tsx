'use client';

import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import PromoBannerForm from './promo-banner-form';
import type { PromoBanner } from '@repo/types';
import type { ProductOption } from './promo-banners-page-client';

interface PromoBannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: PromoBanner | null;
  products: ProductOption[];
  onSuccess: () => void;
}

export function PromoBannerSheet({ open, onOpenChange, banner, products, onSuccess }: PromoBannerSheetProps) {
  const { t } = useTranslation();
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{banner ? t('promoBanners.sheet.editTitle') : t('promoBanners.sheet.createTitle')}</SheetTitle>
          <SheetDescription>
            {banner ? t('promoBanners.sheet.editDescription') : t('promoBanners.sheet.createDescription')}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <PromoBannerForm banner={banner || undefined} products={products} onSuccess={handleSuccess} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
