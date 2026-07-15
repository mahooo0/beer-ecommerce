'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';
import type { Tag } from '@repo/types';
import { Trash2, Pencil, Tags, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalyticsPanel, StatCard, MiniBar } from '@/components/AnalyticsPanel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { DataTableFilters } from '@/components/DataTableFilters';
import { TagSheet } from './tag-sheet';

const TAG_TYPE_OPTIONS = [
  { value: 'PRODUCT', label: 'Product' },
  { value: 'COLLECTION', label: 'Collection' },
  { value: 'BLOG', label: 'Blog' },
  { value: 'CUSTOM', label: 'Custom' },
];

const TAG_TYPE_COLORS: Record<string, string> = {
  PRODUCT: 'bg-blue-100 text-blue-800',
  COLLECTION: 'bg-purple-100 text-purple-800',
  BLOG: 'bg-green-100 text-green-800',
  CUSTOM: 'bg-orange-100 text-orange-800',
};

export default function TagsPage() {
  const { getToken } = useAuth();
  const [tags, setTags] = useState<(Tag & { _count?: { products: number } })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const fetchTags = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await api.tags.getAll({ token, type: typeFilter || undefined });
      setTags(response.data || []);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [typeFilter]);

  const handleDeleteTag = async (tagId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      await api.tags.delete(tagId, token);
      await fetchTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const tagStats = useMemo(() => {
    const byType: Record<string, number> = {};
    let totalProducts = 0;
    tags.forEach((tag) => {
      byType[tag.type] = (byType[tag.type] || 0) + 1;
      totalProducts += tag._count?.products ?? 0;
    });
    return { byType, totalProducts };
  }, [tags]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tags</h1>
        <Button onClick={() => { setEditingTag(null); setSheetOpen(true); }}>
          Add Tag
        </Button>
      </div>

      {/* Analytics */}
      <AnalyticsPanel title="Tag Analytics">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <StatCard label="Total Tags" value={tags.length} icon={<Tags className="h-4 w-4 text-blue-600" />} color="bg-blue-50" />
          <StatCard label="Product Associations" value={tagStats.totalProducts} icon={<Hash className="h-4 w-4 text-purple-600" />} color="bg-purple-50" />
          <StatCard label="Tag Types" value={Object.keys(tagStats.byType).length} icon={<Tags className="h-4 w-4 text-green-600" />} color="bg-green-50" />
        </div>
        <div className="space-y-2">
          {Object.entries(tagStats.byType).map(([type, count]) => (
            <MiniBar key={type} label={type} value={count} max={tags.length} color={TAG_TYPE_COLORS[type]?.split(' ')[0] || 'bg-gray-500'} />
          ))}
        </div>
      </AnalyticsPanel>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <DataTableFilters
        filters={[
          {
            key: 'search',
            label: 'Search',
            type: 'search',
            placeholder: 'Search tags...',
          },
          {
            key: 'type',
            label: 'Type',
            type: 'select',
            placeholder: 'All Types',
            options: TAG_TYPE_OPTIONS,
          },
        ]}
        values={{ search: searchQuery, type: typeFilter }}
        onChange={(key, value) => {
          if (key === 'type') setTypeFilter(value as string);
          if (key === 'search') setSearchQuery(value as string);
        }}
        onReset={() => { setTypeFilter(''); setSearchQuery(''); }}
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.filter((tag) => !searchQuery || tag.name.toLowerCase().includes(searchQuery.toLowerCase())).map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-medium text-foreground">
                  {tag.name}
                </TableCell>
                <TableCell className="text-muted-foreground">{tag.slug}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={TAG_TYPE_COLORS[tag.type] || ''}>
                    {tag.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tag._count?.products ?? 0}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(tag.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <DataTableRowActions actions={[
                    {
                      label: 'Edit',
                      onClick: () => { setEditingTag(tag); setSheetOpen(true); },
                      icon: <Pencil className="h-4 w-4" />,
                    },
                    {
                      label: 'Delete',
                      onClick: () => handleDeleteTag(tag.id),
                      variant: 'destructive',
                      icon: <Trash2 className="h-4 w-4" />,
                      confirm: `Are you sure you want to delete tag "${tag.name}"?`,
                    },
                  ]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {tags.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No tags found. Create one to get started.
          </div>
        )}
      </div>

      <TagSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tag={editingTag}
        onSuccess={fetchTags}
      />
    </div>
  );
}
