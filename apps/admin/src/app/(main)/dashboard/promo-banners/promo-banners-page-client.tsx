'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { PromoBanner } from '@repo/types';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { AnalyticsPanel, StatCard } from '@/components/AnalyticsPanel';
import { Megaphone, CheckCircle2, LinkIcon } from 'lucide-react';
import { PromoBannerRowActions } from './promo-banner-row-actions';
import { PromoBannerSheet } from './promo-banner-sheet';

export interface ProductOption {
  id: string;
  name: string;
}

interface PromoBannersPageClientProps {
  banners: PromoBanner[];
  products: ProductOption[];
}

function targetLabel(b: PromoBanner, t: (k: string) => string): string {
  if (b.product) return `${t('promoBanners.target.product')}: ${b.product.name}`;
  if (b.category) return `${t('promoBanners.target.category')}: ${b.category.name}`;
  if (b.href) return b.href;
  return '—';
}

export function PromoBannersPageClient({ banners, products }: PromoBannersPageClientProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = i18n.language?.startsWith('uk') ? 'uk' : 'pl';

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<PromoBanner | null>(null);

  const activeCount = useMemo(() => banners.filter((b) => b.isActive).length, [banners]);
  const linkedCount = useMemo(
    () => banners.filter((b) => b.productId || b.categoryId || b.href).length,
    [banners],
  );

  const handleSuccess = () => {
    setSheetOpen(false);
    setEditing(null);
    router.refresh();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('promoBanners.title')}</h1>
        <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
          {t('promoBanners.add')}
        </Button>
      </div>

      <div className="mb-4">
        <AnalyticsPanel title={t('promoBanners.analytics.title')}>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label={t('promoBanners.analytics.total')} value={banners.length} icon={<Megaphone className="h-4 w-4 text-blue-600" />} color="bg-blue-50" />
            <StatCard label={t('promoBanners.analytics.active')} value={activeCount} icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} color="bg-green-50" />
            <StatCard label={t('promoBanners.analytics.linked')} value={linkedCount} icon={<LinkIcon className="h-4 w-4 text-purple-600" />} color="bg-purple-50" />
          </div>
        </AnalyticsPanel>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('promoBanners.columns.image')}</TableHead>
              <TableHead>{t('promoBanners.columns.title')}</TableHead>
              <TableHead>{t('promoBanners.columns.target')}</TableHead>
              <TableHead>{t('promoBanners.columns.position')}</TableHead>
              <TableHead>{t('promoBanners.columns.status')}</TableHead>
              <TableHead>{t('promoBanners.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map((banner) => (
              <TableRow key={banner.id}>
                <TableCell>
                  {banner.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={banner.image} alt="" className="h-10 w-16 rounded object-cover" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {(lang === 'uk' ? banner.title?.uk : banner.title?.pl) || banner.title?.pl || banner.title?.uk || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">{targetLabel(banner, t)}</TableCell>
                <TableCell className="text-muted-foreground">{banner.position}</TableCell>
                <TableCell>
                  <span
                    className={
                      banner.isActive
                        ? 'inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'
                        : 'inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'
                    }
                  >
                    {banner.isActive ? t('promoBanners.status.active') : t('promoBanners.status.inactive')}
                  </span>
                </TableCell>
                <TableCell>
                  <PromoBannerRowActions
                    bannerId={banner.id}
                    onEdit={() => { setEditing(banner); setSheetOpen(true); }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {banners.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">{t('promoBanners.empty')}</div>
        )}
      </div>

      <PromoBannerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        banner={editing}
        products={products}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
