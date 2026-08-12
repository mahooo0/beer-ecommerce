'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PublishStatusBadge } from '@/components/blog/publish-status-badge';
import { BlogPostRowActions } from './blog-post-row-actions';

/** A localized field returned by Payload with `?locale=all`. */
type Localized = { pl?: string; uk?: string } | string | null | undefined;

interface HeroMedia {
  url?: string | null;
  thumbnailURL?: string | null;
  sizes?: Record<string, { url?: string | null }> | null;
}

export interface AdminPost {
  id: number | string;
  title?: Localized;
  slug?: string | null;
  _status?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  categories?: Array<{ id: number | string; title?: Localized }> | null;
  heroImage?: HeroMedia | number | string | null;
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

function cover(m: AdminPost['heroImage']): string | undefined {
  if (m && typeof m === 'object') return m.sizes?.card?.url || m.sizes?.thumbnail?.url || m.thumbnailURL || m.url || undefined;
  return undefined;
}

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('blog.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('blog.count', { count: posts.length })}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/blog/new">{t('blog.add')}</Link>
        </Button>
      </div>

      <Input
        placeholder={t('blog.searchPlaceholder')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card py-16 text-center text-muted-foreground">{t('blog.empty')}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const src = cover(p.heroImage);
            const cats = (p.categories || []).map((c) => loc(c.title, lang)).filter(Boolean).join(', ');
            return (
              <div
                key={String(p.id)}
                className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-foreground/20"
              >
                <Link
                  href={`/dashboard/blog/${p.id}/edit`}
                  className="relative block aspect-video overflow-hidden bg-muted"
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Newspaper className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <PublishStatusBadge status={p._status} labels={{ published: t('blog.status.published'), draft: t('blog.status.draft') }} />
                  </div>
                </Link>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/dashboard/blog/${p.id}/edit`}
                      className="line-clamp-2 font-medium text-foreground hover:underline"
                    >
                      {loc(p.title, lang) || '—'}
                    </Link>
                    <div className="-mr-1 -mt-1 shrink-0">
                      <BlogPostRowActions postId={p.id} />
                    </div>
                  </div>
                  {p.slug ? <p className="truncate text-xs text-muted-foreground">/{p.slug}</p> : null}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
                    <span className="truncate">{cats || '—'}</span>
                    <span className="whitespace-nowrap">{fmtDate(p.updatedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
