'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import { ImageIcon, Upload, Loader2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageCropModal } from '@/components/ui/image-crop-modal';
import { api } from '@/lib/api';
import { showError } from '@/lib/toast';

interface MediaDoc {
  id: number | string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  alt?: string | null;
  sizes?: Record<string, { url?: string | null }> | null;
}

function thumb(m: MediaDoc): string | undefined {
  return m.sizes?.thumbnail?.url || m.thumbnailURL || m.url || undefined;
}

export function MediaPicker({
  value,
  valueUrl,
  onChange,
  aspect = 16 / 9,
  width = 176,
}: {
  value: number | string | null;
  valueUrl?: string | null;
  onChange: (id: number | string | null, url: string | null) => void;
  aspect?: number;
  width?: number;
}) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [media, setMedia] = useState<MediaDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropName, setCropName] = useState('image');
  const [uploading, setUploading] = useState(false);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const r = await api.blog.list<MediaDoc>('media', { limit: 200, sort: '-createdAt', depth: 0 }, token);
      setMedia(r.docs || []);
    } catch (err) {
      showError(err instanceof Error ? err.message : t('mediaPicker.errors.load'));
    } finally {
      setLoading(false);
    }
  }, [getToken, t]);

  const openPicker = () => {
    setPickerOpen(true);
    void loadMedia();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCropName((f.name || 'image').replace(/\.[^.]+$/, ''));
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(f);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onCropped = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const file = new File([blob], `${cropName}.webp`, { type: blob.type || 'image/webp' });
      const r = await api.blog.uploadMedia(file, cropName, token);
      const doc = r.doc;
      onChange(doc.id, doc.thumbnailURL || doc.url || null);
      setMedia((prev) => [
        { id: doc.id, url: doc.url, thumbnailURL: doc.thumbnailURL, filename: doc.filename, alt: null },
        ...prev,
      ]);
      setPickerOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : t('mediaPicker.errors.upload'));
    } finally {
      setUploading(false);
    }
  };

  const filtered = media.filter(
    (m) =>
      !q.trim() ||
      (m.filename || '').toLowerCase().includes(q.toLowerCase()) ||
      (m.alt || '').toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-start gap-3">
        <div
          className="relative overflow-hidden rounded-lg border bg-muted"
          style={{ width, aspectRatio: String(aspect) }}
        >
          {valueUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={valueUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openPicker}>
            {t('mediaPicker.choose')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />{t('mediaPicker.uploading')}</>
            ) : (
              <><Upload className="mr-1 h-3.5 w-3.5" />{t('mediaPicker.upload')}</>
            )}
          </Button>
          {value != null && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null, null)}>
              {t('mediaPicker.remove')}
            </Button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('mediaPicker.title')}</DialogTitle>
          </DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('mediaPicker.search')} className="pl-8" />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Upload className="mr-1 h-3.5 w-3.5" />
              {t('mediaPicker.upload')}
            </Button>
          </div>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">{t('mediaPicker.empty')}</div>
          ) : (
            <div className="grid max-h-[50vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
              {filtered.map((m) => (
                <button
                  type="button"
                  key={String(m.id)}
                  onClick={() => { onChange(m.id, thumb(m) || m.url || null); setPickerOpen(false); }}
                  className={`overflow-hidden rounded-md border transition hover:ring-2 hover:ring-primary ${String(value) === String(m.id) ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex aspect-square items-center justify-center bg-muted">
                    {thumb(m) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb(m)} alt={m.alt || ''} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {cropSrc && (
        <ImageCropModal open imageSrc={cropSrc} aspect={aspect} onCrop={onCropped} onCancel={() => setCropSrc(null)} />
      )}
    </div>
  );
}
