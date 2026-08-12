'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import { ArrowUp, ArrowDown, Trash2, Type, FormInput, Image as ImageIcon, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card';
import { RichTextEditor } from '@/components/lexical/rich-text-editor';
import { MediaPicker } from '@/components/blog/media-picker';
import { api } from '@/lib/api';
import { showError, showSuccess } from '@/lib/toast';

type Loc = 'pl' | 'uk';
type Block = Record<string, unknown> & { blockType?: string; id?: string };

export interface FormOpt {
  id: number | string;
  title: string;
}

interface MediaDoc {
  id?: number | string;
  url?: string | null;
  thumbnailURL?: string | null;
  sizes?: Record<string, { url?: string | null }> | null;
}

export interface EditablePage {
  id: number | string;
  title?: { pl?: string | null; uk?: string | null } | null;
  slug?: string | null;
  hero?: unknown;
  layout?: { pl?: Block[] | null; uk?: Block[] | null } | null;
  meta?: {
    pl?: { title?: string | null; description?: string | null } | null;
    uk?: { title?: string | null; description?: string | null } | null;
  } | null;
  _status?: string | null;
}

const EMPTY_RT = {
  root: {
    type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
    children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', children: [] }],
  },
};

const newContent = (): Block => ({ blockType: 'content', columns: [{ size: 'full', richText: EMPTY_RT }] });
const newForm = (formId: number | string | undefined): Block => ({ blockType: 'formBlock', form: formId, enableIntro: false });
const newMedia = (): Block => ({ blockType: 'mediaBlock', media: undefined });

function blockLabel(type: string | undefined, t: (k: string) => string): string {
  if (type === 'content') return t('pages.blocks.content');
  if (type === 'formBlock') return t('pages.blocks.form');
  if (type === 'mediaBlock') return t('pages.blocks.media');
  return type || 'block';
}

function mediaThumb(m: MediaDoc | null | undefined): string | null {
  if (!m) return null;
  return m.sizes?.thumbnail?.url || m.thumbnailURL || m.url || null;
}

/**
 * Bridges a mediaBlock's `media` upload relationship to the shared MediaPicker.
 * The page is fetched with depth=0, so an existing block carries `media` as a
 * numeric id only — we lazily resolve its thumbnail URL for the preview, while
 * the block itself keeps storing the id (writable back to Payload as-is).
 */
function MediaBlockField({ block, onChange }: { block: Block; onChange: (mediaId: number | string | null) => void }) {
  const { getToken } = useAuth();
  const media = (block as { media?: unknown }).media;
  const id = media == null ? null : (typeof media === 'object' ? (media as { id: number | string }).id : (media as number | string));
  const [url, setUrl] = useState<string | null>(typeof media === 'object' ? mediaThumb(media as MediaDoc) : null);

  useEffect(() => {
    let cancelled = false;
    if (id != null && !url) {
      (async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const doc = await api.blog.get<MediaDoc>('media', id, { depth: 0 }, token);
          if (!cancelled) setUrl(mediaThumb(doc));
        } catch {
          /* preview only — ignore resolve failures */
        }
      })();
    }
    return () => { cancelled = true; };
  }, [id, url, getToken]);

  return (
    <MediaPicker
      value={id}
      valueUrl={url}
      onChange={(newId, newUrl) => { setUrl(newUrl); onChange(newId); }}
      aspect={16 / 9}
      width={220}
    />
  );
}

export function PageForm({ page, forms }: { page: EditablePage; forms: FormOpt[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();

  const [locale, setLocale] = useState<Loc>('pl');
  const [titlePl, setTitlePl] = useState(page.title?.pl || '');
  const [titleUk, setTitleUk] = useState(page.title?.uk || '');
  const [slug, setSlug] = useState(page.slug || '');
  const [metaTitlePl, setMetaTitlePl] = useState(page.meta?.pl?.title || '');
  const [metaTitleUk, setMetaTitleUk] = useState(page.meta?.uk?.title || '');
  const [metaDescPl, setMetaDescPl] = useState(page.meta?.pl?.description || '');
  const [metaDescUk, setMetaDescUk] = useState(page.meta?.uk?.description || '');
  const [layoutPl, setLayoutPl] = useState<Block[]>(Array.isArray(page.layout?.pl) ? page.layout!.pl! : []);
  const [layoutUk, setLayoutUk] = useState<Block[]>(Array.isArray(page.layout?.uk) ? page.layout!.uk! : []);
  const [status, setStatus] = useState(page._status === 'published' ? 'published' : 'draft');
  const [saving, setSaving] = useState(false);

  const layout = locale === 'pl' ? layoutPl : layoutUk;
  const setLayout = locale === 'pl' ? setLayoutPl : setLayoutUk;

  const patchBlock = (i: number, patch: (b: Block) => Block) =>
    setLayout(layout.map((b, idx) => (idx === i ? patch({ ...b }) : b)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= layout.length) return;
    const next = [...layout];
    const [moved] = next.splice(i, 1);
    if (moved) next.splice(j, 0, moved);
    setLayout(next);
  };
  const removeAt = (i: number) => setLayout(layout.filter((_, idx) => idx !== i));
  const add = (b: Block) => setLayout([...layout, b]);

  const setContentRt = (i: number, rt: unknown) =>
    patchBlock(i, (b) => {
      const cols = Array.isArray(b.columns) && b.columns.length ? [...(b.columns as Record<string, unknown>[])] : [{ size: 'full' }];
      cols[0] = { ...cols[0], richText: rt };
      return { ...b, columns: cols };
    });

  const save = async (publish?: boolean) => {
    // Both locales are mandatory: title + at least one layout block each.
    if (!titlePl.trim()) { setLocale('pl'); showError(t('pages.errors.titleRequiredPl')); return; }
    if (!titleUk.trim()) { setLocale('uk'); showError(t('pages.errors.titleRequiredUk')); return; }
    if (!layoutPl.length) { setLocale('pl'); showError(t('pages.errors.layoutRequiredPl')); return; }
    if (!layoutUk.length) { setLocale('uk'); showError(t('pages.errors.layoutRequiredUk')); return; }

    const st = publish !== undefined ? (publish ? 'published' : 'draft') : status;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      const plData: Record<string, unknown> = {
        title: titlePl,
        slug: slug || undefined,
        _status: st,
        hero: page.hero ?? { type: 'none' },
        layout: layoutPl,
        meta: { title: metaTitlePl || undefined, description: metaDescPl || undefined },
      };
      await api.blog.update('pages', page.id, plData, { locale: 'pl' }, token);

      const ukData: Record<string, unknown> = {
        title: titleUk || undefined,
        layout: layoutUk,
        meta: { title: metaTitleUk || undefined, description: metaDescUk || undefined },
      };
      await api.blog.update('pages', page.id, ukData, { locale: 'uk' }, token);

      setStatus(st);
      showSuccess(t('pages.saved'));
      router.push('/dashboard/pages');
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : t('pages.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('pages.editTitle')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/pages')} disabled={saving}>{t('pages.cancel')}</Button>
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>{t('pages.saveDraft')}</Button>
          <Button onClick={() => save(true)} disabled={saving}>{saving ? t('pages.saving') : t('pages.publish')}</Button>
        </div>
      </div>

      {/* Locale switch */}
      <div className="inline-flex rounded-md border bg-card p-0.5">
        {(['pl', 'uk'] as Loc[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={`rounded px-4 py-1 text-sm transition-colors ${locale === l ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('pages.sections.basics')}</CardTitle>
          <CardDescription>{t('pages.sections.basicsHint')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>{t('pages.fields.title')} ({locale.toUpperCase()})</Label>
            {locale === 'pl' ? (
              <Input value={titlePl} onChange={(e) => setTitlePl(e.target.value)} />
            ) : (
              <Input value={titleUk} onChange={(e) => setTitleUk(e.target.value)} />
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>{t('pages.fields.slug')}</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" />
          </div>
        </CardContent>
      </Card>

      {/* Layout blocks (localized) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('pages.layout')} ({locale.toUpperCase()})</CardTitle>
          <CardDescription>{t('pages.sections.layoutHint')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {layout.length === 0 && (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">{t('pages.noBlocks')}</div>
          )}
          {layout.map((b, i) => (
            <div key={b.id || i} className="overflow-hidden rounded-lg border bg-background">
              <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  {blockLabel(b.blockType, t)}
                </span>
                <div className="flex items-center gap-0.5 text-muted-foreground">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title={t('pages.moveUp')} className="rounded p-1.5 hover:bg-muted disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === layout.length - 1} title={t('pages.moveDown')} className="rounded p-1.5 hover:bg-muted disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => removeAt(i)} title={t('pages.removeBlock')} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="p-3">
                {b.blockType === 'content' ? (
                  <RichTextEditor
                    key={String(b.id || i) + locale}
                    value={(b.columns as Record<string, unknown>[] | undefined)?.[0]?.richText}
                    onChange={(rt) => setContentRt(i, rt)}
                    placeholder={t('pages.contentPlaceholder')}
                  />
                ) : b.blockType === 'formBlock' ? (
                  <div className="grid gap-1.5">
                    <Label>{t('pages.form')}</Label>
                    <select
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      value={String((b as { form?: unknown }).form ?? '')}
                      onChange={(e) =>
                        patchBlock(i, (bl) => ({
                          ...bl,
                          form: e.target.value ? (Number.isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)) : undefined,
                        }))
                      }
                    >
                      <option value="">—</option>
                      {forms.map((f) => (
                        <option key={String(f.id)} value={String(f.id)}>{f.title}</option>
                      ))}
                    </select>
                  </div>
                ) : b.blockType === 'mediaBlock' ? (
                  <MediaBlockField block={b} onChange={(mediaId) => patchBlock(i, (bl) => ({ ...bl, media: mediaId ?? undefined }))} />
                ) : (
                  <div className="text-sm text-muted-foreground">{t('pages.blockReadonly')}: {b.blockType}</div>
                )}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => add(newContent())}><Type className="mr-1.5 h-4 w-4" />{t('pages.addContent')}</Button>
            <Button variant="outline" size="sm" onClick={() => add(newMedia())}><ImageIcon className="mr-1.5 h-4 w-4" />{t('pages.addMedia')}</Button>
            <Button variant="outline" size="sm" onClick={() => add(newForm(forms[0]?.id))}><FormInput className="mr-1.5 h-4 w-4" />{t('pages.addForm')}</Button>
          </div>
        </CardContent>
      </Card>

      {/* SEO (localized) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('pages.sections.seo')} ({locale.toUpperCase()})</CardTitle>
          <CardDescription>{t('pages.sections.seoHint')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>{t('pages.fields.seoTitle')}</Label>
            {locale === 'pl' ? (
              <Input value={metaTitlePl} onChange={(e) => setMetaTitlePl(e.target.value)} />
            ) : (
              <Input value={metaTitleUk} onChange={(e) => setMetaTitleUk(e.target.value)} />
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>{t('pages.fields.seoDescription')}</Label>
            {locale === 'pl' ? (
              <Textarea value={metaDescPl} onChange={(e) => setMetaDescPl(e.target.value)} rows={2} />
            ) : (
              <Textarea value={metaDescUk} onChange={(e) => setMetaDescUk(e.target.value)} rows={2} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
