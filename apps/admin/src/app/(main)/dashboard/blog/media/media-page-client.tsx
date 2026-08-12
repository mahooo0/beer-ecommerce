'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import { Trash2, UploadCloud, ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { showError, showSuccess } from '@/lib/toast';

export interface AdminMedia {
  id: number | string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  alt?: string | null;
  sizes?: Record<string, { url?: string | null }> | null;
}

function thumb(m: AdminMedia): string | undefined {
  return m.sizes?.thumbnail?.url || m.thumbnailURL || m.url || undefined;
}

export function MediaPageClient({ media }: { media: AdminMedia[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();
  const [uploading, setUploading] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const token = await getToken();
      if (!token) return;
      for (const f of Array.from(files)) {
        await api.blog.uploadMedia(f, f.name, token);
      }
      showSuccess(t('blogMedia.uploaded'));
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : t('blogMedia.errors.uploadFailed'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const del = async (id: number | string) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('blogMedia.deleteConfirm'))) return;
    try {
      const token = await getToken();
      if (!token) return;
      await api.blog.remove('media', id, undefined, token);
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : t('blogMedia.errors.deleteFailed'));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('blogMedia.title')}</h1>
        <label className="inline-flex cursor-pointer items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <UploadCloud className="mr-2 h-4 w-4" />
          {uploading ? t('blogMedia.uploading') : t('blogMedia.upload')}
          <input type="file" accept="image/*" multiple className="hidden" onChange={onFile} disabled={uploading} />
        </label>
      </div>

      {media.length === 0 ? (
        <div className="rounded-lg border bg-card py-12 text-center text-muted-foreground">{t('blogMedia.empty')}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((m) => (
            <div key={String(m.id)} className="group relative overflow-hidden rounded-lg border bg-card">
              <div className="flex aspect-square items-center justify-center bg-muted">
                {thumb(m) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb(m)} alt={m.alt || ''} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="truncate px-2 py-1 text-xs text-muted-foreground" title={m.filename || ''}>
                {m.filename || m.alt || String(m.id)}
              </div>
              <button
                type="button"
                onClick={() => del(m.id)}
                title={t('blogMedia.delete')}
                className="absolute right-1 top-1 hidden rounded bg-black/60 p-1 text-white group-hover:block"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
