'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('blogCategories.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('blogCategories.count', { count: categories.length })}</p>
        </div>
        <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>{t('blogCategories.add')}</Button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border bg-card py-16 text-center text-muted-foreground">{t('blogCategories.empty')}</div>
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {sorted.map((c) => (
            <div key={String(c.id)} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FolderTree className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-foreground">{locTitle(c.title, lang) || '—'}</div>
                <div className="truncate text-xs text-muted-foreground">/{c.slug || '—'}</div>
              </div>
              <CategoryRowActions
                categoryId={c.id}
                onEdit={() => { setEditing(c); setSheetOpen(true); }}
              />
            </div>
          ))}
        </div>
      )}

      <CategorySheet open={sheetOpen} onOpenChange={setSheetOpen} category={editing} onSuccess={handleSuccess} />
    </div>
  );
}
