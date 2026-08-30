'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import type { Collection } from '@repo/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { DataTableFilters, type FilterConfig } from '@/components/DataTableFilters';
import { AnalyticsPanel, StatCard } from '@/components/AnalyticsPanel';
import { Layers, CheckCircle, XCircle } from 'lucide-react';
import { CollectionRowActions } from './collection-row-actions';
import { CollectionSheet } from './collection-sheet';

interface CollectionsPageClientProps {
  collections: Collection[];
}

export function CollectionsPageClient({ collections }: CollectionsPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const collectionFilterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'search',
        label: t('collections.filters.search'),
        type: 'search',
        placeholder: t('collections.filters.searchPlaceholder'),
      },
    ],
    [t],
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({ search: '' });

  const filteredCollections = useMemo(() => {
    const search = (filterValues.search as string || '').toLowerCase();
    if (!search) return collections;
    return collections.filter((c) => c.name.toLowerCase().includes(search));
  }, [collections, filterValues.search]);

  const handleSuccess = () => {
    setSheetOpen(false);
    setEditingCollection(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">{t('collections.title')}</h1>
        <Button onClick={() => { setEditingCollection(null); setSheetOpen(true); }}>
          {t('collections.add')}
        </Button>
      </div>

      {collections.length > 0 && (
        <AnalyticsPanel title={t('collections.analytics.title')}>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label={t('collections.analytics.total')} value={collections.length} icon={<Layers className="h-4 w-4" />} tone="blue" />
            <StatCard label={t('collections.analytics.active')} value={collections.filter((c) => c.isActive).length} icon={<CheckCircle className="h-4 w-4" />} tone="emerald" />
            <StatCard label={t('collections.analytics.inactive')} value={collections.filter((c) => !c.isActive).length} icon={<XCircle className="h-4 w-4" />} tone="rose" />
          </div>
        </AnalyticsPanel>
      )}

      <DataTableFilters
        filters={collectionFilterConfigs}
        values={filterValues}
        onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
        onReset={() => setFilterValues({ search: '' })}
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('collections.columns.name')}</TableHead>
              <TableHead>{t('collections.columns.slug')}</TableHead>
              <TableHead>{t('collections.columns.products')}</TableHead>
              <TableHead>{t('collections.columns.status')}</TableHead>
              <TableHead>{t('collections.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCollections.map((collection) => (
              <TableRow key={collection.id}>
                <TableCell className="font-medium text-foreground">
                  {collection.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {collection.slug}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  -
                </TableCell>
                <TableCell>
                  {collection.isActive ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {t('collections.status.active')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      {t('collections.status.inactive')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <CollectionRowActions
                    collectionId={collection.id}
                    onEdit={() => { setEditingCollection(collection); setSheetOpen(true); }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredCollections.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {t('collections.empty')}
          </div>
        )}
      </div>

      <CollectionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        collection={editingCollection}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
