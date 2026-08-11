'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { showError } from '@/lib/toast';

// Storage presets accepted by api.upload.single. The catalog stores category
// icons/banners and attribute-value icons — all square/thumbnail assets, so we
// route them through the 'category' preset (16:9 is only used by ImageUpload's
// crop; this raw single-file upload sends the file as-is).
type UploadPreset = 'product' | 'category' | 'brand' | 'collection' | 'avatar';

interface SingleImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Storage preset (folder/policy) the file is uploaded under. */
  preset?: UploadPreset;
  label?: string;
  className?: string;
  /** Preview/upload box side in px. Defaults to 96 (h-24 w-24). */
  size?: number;
}

/**
 * Compact single-image upload used across the category detail page for the
 * category icon/banner and each attribute-value icon. Ported from 4fr-ecom's
 * SingleImageUpload; adapted to taranka's storage API (api.upload.single) and
 * toast helper. Uploads immediately on file pick, emits the resulting URL.
 */
export default function SingleImageUpload({
  value,
  onChange,
  preset = 'category',
  label,
  className,
  size = 96,
}: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.upload.single(file, preset);
      onChange(url);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className={className}>
      {label && <p className="mb-2 text-sm font-medium">{label}</p>}
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label || 'Preview'}
            style={{ height: size, width: size }}
            className="rounded border object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 cursor-pointer rounded-full"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ height: size, width: size }}
          className="flex flex-col items-center justify-center rounded border-2 border-dashed transition-colors hover:border-primary/50 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
