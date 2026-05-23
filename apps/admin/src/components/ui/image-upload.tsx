'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ImageCropModal } from './image-crop-modal';
import { api } from '@/lib/api';

type Preset = 'product' | 'category' | 'brand' | 'collection' | 'avatar';

const ASPECT_RATIOS: Record<Preset, number> = {
  product: 1,
  category: 16 / 9,
  brand: 1,
  collection: 16 / 9,
  avatar: 1,
};

interface ImageUploadProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  preset: Preset;
  multiple?: boolean;
  maxFiles?: number;
}

export function ImageUpload({
  value,
  onChange,
  preset,
  multiple = false,
  maxFiles = 10,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const images = Array.isArray(value) ? value : value ? [value] : [];
  const canUploadMore = images.length < (multiple ? maxFiles : 1);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Reset input so the same file can be selected again
      if (inputRef.current) inputRef.current.value = '';
    },
    []
  );

  const handleCrop = useCallback(
    async (blob: Blob) => {
      setCropImage(null);
      setIsUploading(true);

      try {
        const result = await api.upload.single(blob, preset);
        if (multiple) {
          onChange([...images, result.url]);
        } else {
          onChange(result.url);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    },
    [images, multiple, onChange, preset]
  );

  const handleRemove = useCallback(
    (url: string) => {
      // Extract ID from URL for deletion (best-effort, non-blocking)
      const match = url.match(/\/([a-f0-9-]+)\.webp$/);
      if (match?.[1]) {
        api.upload.delete(match[1]).catch(() => {});
      }

      if (multiple) {
        onChange(images.filter((img) => img !== url));
      } else {
        onChange('');
      }
    },
    [images, multiple, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      {canUploadMore && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div className="text-sm text-gray-600">
              {isUploading ? (
                <span>Uploading...</span>
              ) : (
                <span>
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              JPG, PNG, WebP, or GIF (max 10MB)
            </div>
          </div>
        </div>
      )}

      {/* Preview thumbnails */}
      {images.length > 0 && (
        <div className={`grid gap-3 ${multiple ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 max-w-[200px]'}`}>
          {images.map((url) => (
            <div
              key={url}
              className="relative group border-2 border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              <div className={preset === 'category' || preset === 'collection' ? 'aspect-video' : 'aspect-square'} style={{ position: 'relative' }}>
                <Image
                  src={url}
                  alt="Uploaded image"
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Remove image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Image count for multi-upload */}
      {multiple && images.length > 0 && (
        <div className="text-sm text-gray-600">
          {images.length}/{maxFiles} images
        </div>
      )}

      {/* Crop modal */}
      {cropImage && (
        <ImageCropModal
          open={true}
          imageSrc={cropImage}
          aspect={ASPECT_RATIOS[preset]}
          onCrop={handleCrop}
          onCancel={() => setCropImage(null)}
        />
      )}
    </div>
  );
}
