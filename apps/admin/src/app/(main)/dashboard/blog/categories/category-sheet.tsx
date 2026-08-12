'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { slugify } from '@/lib/slugify';
import { showError, showSuccess } from '@/lib/toast';
import { locTitle, type AdminCategory } from './categories-page-client';

export function CategorySheet({
  open,
  onOpenChange,
  category,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category: AdminCategory | null;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const { getToken } = useAuth();

  const [titlePl, setTitlePl] = useState('');
  const [titleUk, setTitleUk] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitlePl(locTitle(category?.title, 'pl'));
      setTitleUk(locTitle(category?.title, 'uk'));
      setSlug(category?.slug || '');
      setSlugTouched(Boolean(category));
    }
  }, [open, category]);

  const onTitlePl = (v: string) => {
    setTitlePl(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const submit = async () => {
    if (!titlePl.trim()) {
      showError(t('blogCategories.errors.titleRequired'));
      return;
    }
    if (!titleUk.trim()) {
      showError(t('blogCategories.errors.titleRequiredUk'));
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;

      let id = category?.id;
      // Localized writes go one locale at a time (Payload REST).
      if (id != null) {
        await api.blog.update('categories', id, { title: titlePl, slug: slug || undefined }, { locale: 'pl' }, token);
      } else {
        const created = await api.blog.create<{ id: number | string }>(
          'categories',
          { title: titlePl, slug: slug || undefined },
          { locale: 'pl' },
          token,
        );
        id = created.doc.id;
      }
      if (id != null && titleUk.trim()) {
        await api.blog.update('categories', id, { title: titleUk }, { locale: 'uk' }, token);
      }

      showSuccess(t('blogCategories.saved'));
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      showError(err instanceof Error ? err.message : t('blogCategories.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {category ? t('blogCategories.sheet.editTitle') : t('blogCategories.sheet.createTitle')}
          </SheetTitle>
          <SheetDescription>{t('blogCategories.sheet.description')}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4 py-4">
          <div className="grid gap-1.5">
            <Label>{t('blogCategories.form.titlePl')}</Label>
            <Input value={titlePl} onChange={(e) => onTitlePl(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t('blogCategories.form.titleUk')}</Label>
            <Input value={titleUk} onChange={(e) => setTitleUk(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t('blogCategories.form.slug')}</Label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="slug"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t('blogCategories.form.cancel')}
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving
                ? t('blogCategories.form.saving')
                : category
                  ? t('blogCategories.form.update')
                  : t('blogCategories.form.create')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
