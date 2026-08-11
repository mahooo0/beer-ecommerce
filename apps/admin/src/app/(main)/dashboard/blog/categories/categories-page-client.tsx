'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { AnalyticsPanel, StatCard } from '@/components/AnalyticsPanel';
import { CategorySheet } from './category-sheet';
import { CategoryRowActions } from './category-row-actions';

export interface AdminCategory {
  id: number | string;
  title?: { pl?: string; uk?: string } | string | null;
  slug?: string | null;
}

export function locTitle(v: AdminCategory['title'], lang: 'pl' | 'uk'): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return (lang === 'uk' ? v.uk : v.pl) || v.pl || v.uk || '';
}

export function CategoriesPageClient({ categories }: { categories: AdminCategory[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('uk') ? 'uk' : 'pl';
  const router = useRouter();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);

  const handleSuccess = () => {
    setEditing(null);
    router.refresh();
  };

  const sorted = useMemo(
    () => [...categories].sort((a, b) => locTitle(a.title, lang).localeCompare(locTitle(b.title, lang))),
    [categories, lang],
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('blogCategories.title')}</h1>
        <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>{t('blogCategories.add')}</Button>
      </div>

      <div className="mb-4">
        <AnalyticsPanel title={t('blogCategories.analytics.title')}>
          <div className="grid grid-cols-1 gap-3">
            <StatCard label={t('blogCategories.analytics.total')} value={categories.length} icon={<FolderTree className="h-4 w-4 text-blue-600" />} color="bg-blue-50" />
          </div>
        </AnalyticsPanel>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('blogCategories.columns.title')}</TableHead>
              <TableHead>{t('blogCategories.columns.slug')}</TableHead>
              <TableHead>{t('blogCategories.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c) => (
              <TableRow key={String(c.id)}>
                <TableCell className="font-medium text-foreground">{locTitle(c.title, lang) || '—'}</TableCell>
                <TableCell className="text-muted-foreground">{c.slug || '—'}</TableCell>
                <TableCell>
                  <CategoryRowActions
                    categoryId={c.id}
                    onEdit={() => { setEditing(c); setSheetOpen(true); }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {categories.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">{t('blogCategories.empty')}</div>
        )}
      </div>

      <CategorySheet open={sheetOpen} onOpenChange={setSheetOpen} category={editing} onSuccess={handleSuccess} />
    </div>
  );
}
