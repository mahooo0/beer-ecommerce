'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { FileText, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublishStatusBadge } from '@/components/blog/publish-status-badge';

export interface AdminPage {
  id: number | string;
  title?: { pl?: string; uk?: string } | string | null;
  slug?: string | null;
  _status?: string | null;
}

function loc(v: AdminPage['title'], lang: 'pl' | 'uk'): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return (lang === 'uk' ? v.uk : v.pl) || v.pl || v.uk || '';
}

export function PagesListClient({ pages }: { pages: AdminPage[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('uk') ? 'uk' : 'pl';
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('pages.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('pages.count', { count: pages.length })}</p>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-lg border bg-card py-16 text-center text-muted-foreground">{t('pages.empty')}</div>
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {pages.map((p) => (
            <div key={String(p.id)} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-foreground">{loc(p.title, lang) || '—'}</div>
                <div className="truncate text-xs text-muted-foreground">/{p.slug}</div>
              </div>
              <PublishStatusBadge
                status={p._status}
                labels={{ published: t('pages.status.published'), draft: t('pages.status.draft') }}
              />
              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/pages/${p.id}/edit`)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                {t('pages.edit')}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
