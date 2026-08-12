'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { FileText, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { AnalyticsPanel, StatCard } from '@/components/AnalyticsPanel';

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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.title')}</h1>
      </div>

      <div className="mb-4">
        <AnalyticsPanel title={t('pages.analytics.title')}>
          <div className="grid grid-cols-1 gap-3">
            <StatCard label={t('pages.analytics.total')} value={pages.length} icon={<FileText className="h-4 w-4 text-blue-600" />} color="bg-blue-50" />
          </div>
        </AnalyticsPanel>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('pages.columns.title')}</TableHead>
              <TableHead>{t('pages.columns.slug')}</TableHead>
              <TableHead>{t('pages.columns.status')}</TableHead>
              <TableHead>{t('pages.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((p) => (
              <TableRow key={String(p.id)}>
                <TableCell className="font-medium text-foreground">{loc(p.title, lang) || '—'}</TableCell>
                <TableCell className="text-muted-foreground">/{p.slug}</TableCell>
                <TableCell>
                  <span
                    className={
                      p._status === 'published'
                        ? 'inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'
                        : 'inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700'
                    }
                  >
                    {p._status === 'published' ? t('pages.status.published') : t('pages.status.draft')}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/pages/${p.id}/edit`)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    {t('pages.edit')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {pages.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">{t('pages.empty')}</div>
        )}
      </div>
    </div>
  );
}
