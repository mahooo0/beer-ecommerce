'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { Brand } from '@repo/types';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { DataTableFilters, type FilterConfig } from '@/components/DataTableFilters';
import { AnalyticsPanel, StatCard } from '@/components/AnalyticsPanel';
import { Tag, Image, Globe } from 'lucide-react';
import { BrandRowActions } from './brand-row-actions';
import { BrandSheet } from './brand-sheet';

interface BrandsPageClientProps {
  brands: Brand[];
}

export function BrandsPageClient({ brands }: BrandsPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const brandFilterConfigs: FilterConfig[] = useMemo(
    () => [
      { key: 'search', label: t('brands.filters.search'), type: 'search', placeholder: t('brands.filters.searchPlaceholder') },
    ],
    [t],
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({ search: '' });

  const filteredBrands = useMemo(() => {
    const search = (filterValues.search as string || '').toLowerCase();
    if (!search) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(search));
  }, [brands, filterValues.search]);

  const handleSuccess = () => {
    setSheetOpen(false);
    setEditingBrand(null);
    router.refresh();
  };

  const brandsWithLogos = brands.filter((b) => b.logo).length;
  const brandsWithWebsites = brands.filter((b) => b.website).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('brands.title')}</h1>
        <Button onClick={() => { setEditingBrand(null); setSheetOpen(true); }}>
          {t('brands.addBrand')}
        </Button>
      </div>

      <div className="mb-4">
        <AnalyticsPanel title={t('brands.analytics.title')}>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label={t('brands.analytics.totalBrands')} value={brands.length} icon={<Tag className="h-4 w-4 text-blue-600" />} color="bg-blue-50" />
            <StatCard label={t('brands.analytics.withLogos')} value={brandsWithLogos} icon={<Image className="h-4 w-4 text-purple-600" />} color="bg-purple-50" subtitle={`${brands.length > 0 ? Math.round((brandsWithLogos / brands.length) * 100) : 0}%`} />
            <StatCard label={t('brands.analytics.withWebsites')} value={brandsWithWebsites} icon={<Globe className="h-4 w-4 text-green-600" />} color="bg-green-50" subtitle={`${brands.length > 0 ? Math.round((brandsWithWebsites / brands.length) * 100) : 0}%`} />
          </div>
        </AnalyticsPanel>
      </div>

      <div className="mb-4">
        <DataTableFilters
          filters={brandFilterConfigs}
          values={filterValues}
          onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
          onReset={() => setFilterValues({ search: '' })}
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('brands.columns.name')}</TableHead>
              <TableHead>{t('brands.columns.slug')}</TableHead>
              <TableHead>{t('brands.columns.logo')}</TableHead>
              <TableHead>{t('brands.columns.website')}</TableHead>
              <TableHead>{t('brands.columns.products')}</TableHead>
              <TableHead>{t('brands.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBrands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell className="font-medium text-foreground">
                  {brand.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {brand.slug}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="h-8 w-8 object-contain" />
                  ) : (
                    <span className="text-muted-foreground">{t('brands.noLogo')}</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {brand.website ? (
                    <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{t('brands.visit')}</a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">-</TableCell>
                <TableCell>
                  <BrandRowActions
                    brandId={brand.id}
                    onEdit={() => { setEditingBrand(brand); setSheetOpen(true); }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredBrands.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {t('brands.empty')}
          </div>
        )}
      </div>

      <BrandSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        brand={editingBrand}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
