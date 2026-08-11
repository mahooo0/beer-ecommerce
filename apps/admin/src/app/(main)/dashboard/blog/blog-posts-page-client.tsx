'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Newspaper, CheckCircle2, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { AnalyticsPanel, StatCard } from '@/components/AnalyticsPanel';
import { BlogPostRowActions } from './blog-post-row-actions';

/** A localized field returned by Payload with `?locale=all`. */
type Localized = { pl?: string; uk?: string } | string | null | undefined;

export interface AdminPost {
  id: number | string;
  title?: Localized;
  slug?: string | null;
  _status?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  categories?: Array<{ id: number | string; title?: Localized }> | null;
}

function loc(v: Localized, lang: 'pl' | 'uk'): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return (lang === 'uk' ? v.uk : v.pl) || v.pl || v.uk || '';
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'https://cms.dev.taranka.online';

export function BlogPostsPageClient({ posts }: { posts: AdminPost[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('uk') ? 'uk' : 'pl';
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return posts;
    return posts.filter(
      (p) => loc(p.title, lang).toLowerCase().includes(s) || (p.slug || '').toLowerCase().includes(s),
    );
  }, [posts, q, lang]);

  const publishedCount = useMemo(() => posts.filter((p) => p._status === 'published').length, [posts]);
  const draftCount = posts.length - publishedCount;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('blog.title')}</h1>
        {/* TODO(editor): swap to native /dashboard/blog/new once the post editor lands. */}
        <Button asChild>
          <a href={`${CMS_URL}/admin/collections/posts/create`} target="_blank" rel="noreferrer">
            {t('blog.add')}
          </a>
        </Button>
      </div>

      <div className="mb-4">
        <AnalyticsPanel title={t('blog.analytics.title')}>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label={t('blog.analytics.total')} value={posts.length} icon={<Newspaper className="h-4 w-4 text-blue-600" />} color="bg-blue-50" />
            <StatCard label={t('blog.analytics.published')} value={publishedCount} icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} color="bg-green-50" />
            <StatCard label={t('blog.analytics.drafts')} value={draftCount} icon={<FileEdit className="h-4 w-4 text-amber-600" />} color="bg-amber-50" />
          </div>
        </AnalyticsPanel>
      </div>

      <div className="mb-3">
        <Input
          placeholder={t('blog.searchPlaceholder')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('blog.columns.title')}</TableHead>
              <TableHead>{t('blog.columns.categories')}</TableHead>
              <TableHead>{t('blog.columns.status')}</TableHead>
              <TableHead>{t('blog.columns.updated')}</TableHead>
              <TableHead>{t('blog.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={String(p.id)}>
                <TableCell className="font-medium text-foreground">
                  {loc(p.title, lang) || '—'}
                  {p.slug ? <span className="ml-2 text-xs text-muted-foreground">/{p.slug}</span> : null}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {(p.categories || []).map((c) => loc(c.title, lang)).filter(Boolean).join(', ') || '—'}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      p._status === 'published'
                        ? 'inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'
                        : 'inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700'
                    }
                  >
                    {p._status === 'published' ? t('blog.status.published') : t('blog.status.draft')}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{fmtDate(p.updatedAt)}</TableCell>
                <TableCell>
                  <BlogPostRowActions postId={p.id} editHref={`${CMS_URL}/admin/collections/posts/${p.id}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">{t('blog.empty')}</div>
        )}
      </div>
    </div>
  );
}
