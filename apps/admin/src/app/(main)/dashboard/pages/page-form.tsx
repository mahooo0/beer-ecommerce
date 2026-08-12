'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/lexical/rich-text-editor';
import { api } from '@/lib/api';
import { showError, showSuccess } from '@/lib/toast';

type Loc = 'pl' | 'uk';
type Block = Record<string, unknown> & { blockType?: string; id?: string };

export interface FormOpt {
  id: number | string;
  title: string;
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

function blockLabel(type: string | undefined, t: (k: string) => string): string {
  if (type === 'content') return t('pages.blocks.content');
  if (type === 'formBlock') return t('pages.blocks.form');
  return type || 'block';
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
    [next[i], next[j]] = [next[j], next[i]];
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
    if (!titlePl.trim()) { showError(t('pages.errors.titleRequired')); return; }
    if (!layoutPl.length) { showError(t('pages.errors.layoutRequired')); return; }
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
        meta: { title: metaTitleUk || undefined, description: metaDescUk || undefined },
      };
      if (layoutUk.length) ukData.layout = layoutUk;
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
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.editTitle')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/pages')} disabled={saving}>{t('pages.cancel')}</Button>
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>{t('pages.saveDraft')}</Button>
          <Button onClick={() => save(true)} disabled={saving}>{saving ? t('pages.saving') : t('pages.publish')}</Button>
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

        {/* Layout blocks (localized) */}
        <div className="grid gap-3">
          <Label>{t('pages.layout')} ({locale.toUpperCase()})</Label>
          {layout.length === 0 && (
            <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">{t('pages.noBlocks')}</div>
          )}
          {layout.map((b, i) => (
            <div key={b.id || i} className="rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-sm font-medium text-foreground">{blockLabel(b.blockType, t)}</span>
                <div className="flex gap-1 text-muted-foreground">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === layout.length - 1} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => removeAt(i)} className="rounded p-1 text-red-600 hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
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
                ) : (
                  <div className="text-sm text-muted-foreground">{t('pages.blockReadonly')}: {b.blockType}</div>
                )}
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => add(newContent())}><Plus className="mr-1 h-4 w-4" />{t('pages.addContent')}</Button>
            <Button variant="outline" size="sm" onClick={() => add(newForm(forms[0]?.id))}><Plus className="mr-1 h-4 w-4" />{t('pages.addForm')}</Button>
          </div>
        </div>

        {/* SEO (localized) */}
        <div className="grid gap-1.5">
          <Label>{t('pages.fields.seoTitle')} ({locale.toUpperCase()})</Label>
          {locale === 'pl' ? (
            <Input value={metaTitlePl} onChange={(e) => setMetaTitlePl(e.target.value)} />
          ) : (
            <Input value={metaTitleUk} onChange={(e) => setMetaTitleUk(e.target.value)} />
          )}
        </div>
        <div className="grid gap-1.5">
          <Label>{t('pages.fields.seoDescription')} ({locale.toUpperCase()})</Label>
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
