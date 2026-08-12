'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/lexical/rich-text-editor';
import { MediaPicker } from '@/components/blog/media-picker';
import { slugify } from '@/lib/slugify';
import { api } from '@/lib/api';
import { showError, showSuccess } from '@/lib/toast';

type Loc = 'pl' | 'uk';

export interface CategoryOpt {
  id: number | string;
  title: string;
}

export interface EditablePost {
  id: number | string;
  title?: { pl?: string | null; uk?: string | null } | null;
  slug?: string | null;
  content?: { pl?: unknown; uk?: unknown } | null;
  meta?: {
    pl?: { title?: string | null; description?: string | null } | null;
    uk?: { title?: string | null; description?: string | null } | null;
  } | null;
  categories?: Array<{ id: number | string } | number | string> | null;
  heroImage?: HeroMedia | number | string | null;
  _status?: string | null;
}

interface HeroMedia {
  id: number | string;
  url?: string | null;
  thumbnailURL?: string | null;
  sizes?: Record<string, { url?: string | null }> | null;
}

function catId(c: { id: number | string } | number | string): number | string {
  return typeof c === 'object' ? c.id : c;
}
function mediaId(m: EditablePost['heroImage']): number | string | null {
  if (m == null) return null;
  return typeof m === 'object' ? m.id : m;
}
function mediaUrl(m: EditablePost['heroImage']): string | null {
  if (m && typeof m === 'object') return m.sizes?.thumbnail?.url || m.thumbnailURL || m.url || null;
  return null;
}
/** Does a Lexical value contain any non-empty text? (for required validation) */
function hasText(rt: unknown): boolean {
  const walk = (n: { type?: string; text?: string; children?: unknown[] } | null): boolean => {
    if (!n || typeof n !== 'object') return false;
    if (n.type === 'text' && (n.text || '').trim()) return true;
    return Array.isArray(n.children) && n.children.some((c) => walk(c as never));
  };
  return walk((rt as { root?: { children?: unknown[] } } | null)?.root ?? null);
}

export function PostForm({ post, categories }: { post?: EditablePost | null; categories: CategoryOpt[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();

  const [locale, setLocale] = useState<Loc>('pl');
  const [titlePl, setTitlePl] = useState(post?.title?.pl || '');
  const [titleUk, setTitleUk] = useState(post?.title?.uk || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [contentPl, setContentPl] = useState<unknown>(post?.content?.pl ?? null);
  const [contentUk, setContentUk] = useState<unknown>(post?.content?.uk ?? null);
  const [metaTitlePl, setMetaTitlePl] = useState(post?.meta?.pl?.title || '');
  const [metaTitleUk, setMetaTitleUk] = useState(post?.meta?.uk?.title || '');
  const [metaDescPl, setMetaDescPl] = useState(post?.meta?.pl?.description || '');
  const [metaDescUk, setMetaDescUk] = useState(post?.meta?.uk?.description || '');
  const [catIds, setCatIds] = useState<Array<number | string>>((post?.categories || []).map(catId));
  const [heroId, setHeroId] = useState<number | string | null>(mediaId(post?.heroImage));
  const [heroUrl, setHeroUrl] = useState<string | null>(mediaUrl(post?.heroImage));
  const [status, setStatus] = useState(post?._status === 'published' ? 'published' : 'draft');
  const [saving, setSaving] = useState(false);

  const onTitlePl = (v: string) => {
    setTitlePl(v);
    if (!slugTouched) setSlug(slugify(v));
  };
  const toggleCat = (id: number | string) =>
    setCatIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = async (publish?: boolean) => {
    // Both locales are mandatory.
    if (!titlePl.trim()) { setLocale('pl'); showError(t('blogPost.errors.titleRequiredPl')); return; }
    if (!titleUk.trim()) { setLocale('uk'); showError(t('blogPost.errors.titleRequiredUk')); return; }
    if (!hasText(contentPl)) { setLocale('pl'); showError(t('blogPost.errors.contentRequiredPl')); return; }
    if (!hasText(contentUk)) { setLocale('uk'); showError(t('blogPost.errors.contentRequiredUk')); return; }

    const st = publish !== undefined ? (publish ? 'published' : 'draft') : status;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;

      const plData: Record<string, unknown> = {
        title: titlePl,
        slug: slug || undefined,
        _status: st,
        categories: catIds,
        heroImage: heroId,
        content: contentPl,
        meta: { title: metaTitlePl || undefined, description: metaDescPl || undefined },
      };

      const ukData: Record<string, unknown> = {
        title: titleUk,
        content: contentUk,
        meta: { title: metaTitleUk || undefined, description: metaDescUk || undefined },
      };

      let id = post?.id;
      if (id != null) {
        await api.blog.update('posts', id, plData, { locale: 'pl' }, token);
      } else {
        const created = await api.blog.create<{ id: number | string }>('posts', plData, { locale: 'pl' }, token);
        id = created.doc.id;
      }
      if (id != null) {
        await api.blog.update('posts', id, ukData, { locale: 'uk' }, token);
      }

      setStatus(st);
      showSuccess(t('blogPost.saved'));
      router.push('/dashboard/blog');
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : t('blogPost.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">
          {post ? t('blogPost.editTitle') : t('blogPost.createTitle')}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/blog')} disabled={saving}>
            {t('blogPost.cancel')}
          </Button>
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>
            {t('blogPost.saveDraft')}
          </Button>
          <Button onClick={() => save(true)} disabled={saving}>
            {saving ? t('blogPost.saving') : t('blogPost.publish')}
          </Button>
        </div>
      </div>

      <div className="mb-4 inline-flex rounded-md border p-0.5">
        {(['pl', 'uk'] as Loc[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={`rounded px-3 py-1 text-sm ${locale === l ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground'}`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid gap-5">
        <div className="grid gap-1.5">
          <Label>{t('blogPost.fields.title')} ({locale.toUpperCase()})</Label>
          {locale === 'pl' ? (
            <Input value={titlePl} onChange={(e) => onTitlePl(e.target.value)} />
          ) : (
            <Input value={titleUk} onChange={(e) => setTitleUk(e.target.value)} />
          )}
        </div>

        <div className="grid gap-1.5">
          <Label>{t('blogPost.fields.slug')}</Label>
          <Input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} placeholder="slug" />
        </div>

        <div className="grid gap-1.5">
          <Label>{t('blogPost.fields.hero')}</Label>
          <MediaPicker
            value={heroId}
            valueUrl={heroUrl}
            onChange={(id, url) => { setHeroId(id); setHeroUrl(url); }}
            aspect={16 / 9}
          />
        </div>

        <div className="grid gap-1.5">
          <Label>{t('blogPost.fields.content')} ({locale.toUpperCase()})</Label>
          {locale === 'pl' ? (
            <RichTextEditor key="pl" value={contentPl} onChange={setContentPl} placeholder={t('blogPost.fields.contentPlaceholder')} />
          ) : (
            <RichTextEditor key="uk" value={contentUk} onChange={setContentUk} placeholder={t('blogPost.fields.contentPlaceholder')} />
          )}
        </div>

        <div className="grid gap-1.5">
          <Label>{t('blogPost.fields.categories')}</Label>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 && (
              <span className="text-sm text-muted-foreground">{t('blogPost.fields.noCategories')}</span>
            )}
            {categories.map((c) => (
              <button
                key={String(c.id)}
                type="button"
                onClick={() => toggleCat(c.id)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  catIds.includes(c.id) ? 'border-primary bg-primary/10 text-foreground' : 'text-muted-foreground'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label>{t('blogPost.fields.seoTitle')} ({locale.toUpperCase()})</Label>
          {locale === 'pl' ? (
            <Input value={metaTitlePl} onChange={(e) => setMetaTitlePl(e.target.value)} />
          ) : (
            <Input value={metaTitleUk} onChange={(e) => setMetaTitleUk(e.target.value)} />
          )}
        </div>
        <div className="grid gap-1.5">
          <Label>{t('blogPost.fields.seoDescription')} ({locale.toUpperCase()})</Label>
          {locale === 'pl' ? (
            <Textarea value={metaDescPl} onChange={(e) => setMetaDescPl(e.target.value)} rows={2} />
          ) : (
            <Textarea value={metaDescUk} onChange={(e) => setMetaDescUk(e.target.value)} rows={2} />
          )}
        </div>
      </div>
    </div>
  );
}
