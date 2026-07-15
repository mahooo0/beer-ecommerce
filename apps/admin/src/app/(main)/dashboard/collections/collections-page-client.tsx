'use client';

import { useState, useMemo } from 'react';
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

const collectionFilterConfigs: FilterConfig[] = [
  { key: 'search', label: 'Search', type: 'search', placeholder: 'Search collections...' },
];

interface CollectionsPageClientProps {
  collections: Collection[];
}

export function CollectionsPageClient({ collections }: CollectionsPageClientProps) {
  const router = useRouter();
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
        <h1 className="text-2xl font-bold text-foreground">Collections</h1>
        <Button onClick={() => { setEditingCollection(null); setSheetOpen(true); }}>
          Add Collection
        </Button>
      </div>

      {collections.length > 0 && (
        <AnalyticsPanel title="Collection Analytics">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total Collections" value={collections.length} icon={<Layers className="h-4 w-4 text-blue-600" />} color="bg-blue-50" />
            <StatCard label="Active" value={collections.filter((c) => c.isActive).length} icon={<CheckCircle className="h-4 w-4 text-green-600" />} color="bg-green-50" />
            <StatCard label="Inactive" value={collections.filter((c) => !c.isActive).length} icon={<XCircle className="h-4 w-4 text-red-600" />} color="bg-red-50" />
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
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
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
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      Inactive
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
            No collections found. Create one to get started.
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
