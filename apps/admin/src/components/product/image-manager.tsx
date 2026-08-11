'use client';

/**
 * ImageManager — full product image gallery.
 *
 * Ported from 4fr's MultiImageUpload, adapted to taranka's existing upload path.
 * Features:
 *   - multi-upload with crop (reuses taranka `ImageUpload`, which POSTs cropped
 *     blobs to STORAGE_URL/upload via `api.upload.single`)
 *   - drag-and-drop reorder (@dnd-kit) — the FIRST image is the main image
 *   - "set as main" (moves an image to index 0)
 *   - remove a single image
 *   - clear-all
 *
 * The gallery is fully controlled: it holds no local image state, only emits the
 * new ordered `string[]` back to the parent form.
 */

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { GripVertical, Star, X } from 'lucide-react';
import { ImageUpload } from '../ui/image-upload';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
}

export function ImageManager({
  images,
  onChange,
  maxFiles = 10,
}: ImageManagerProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(images, oldIndex, newIndex));
      }
    }
  };

  const handleRemove = (url: string) => {
    onChange(images.filter((img) => img !== url));
  };

  const handleSetMain = (url: string) => {
    if (images[0] === url) return;
    onChange([url, ...images.filter((img) => img !== url)]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Upload zone (crop + upload). Only shows the drop area; previews below. */}
      <ImageUpload
        // Pass an empty array so ImageUpload renders ONLY its upload zone — the
        // gallery below owns the previews/reorder/remove UX.
        value={[]}
        onChange={(val) => {
          const added = Array.isArray(val) ? val : val ? [val] : [];
          const next = [...images, ...added].slice(0, maxFiles);
          onChange(next);
        }}
        preset="product"
        multiple
        maxFiles={maxFiles}
      />

      {images.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {t('productForm.images.count', { count: images.length, max: maxFiles })}
            {images.length > 1 && t('productForm.images.reorderHint')}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={handleClearAll}
          >
            {t('productForm.images.clearAll')}
          </Button>
        </div>
      )}

      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((url, index) => (
                <SortableGalleryImage
                  key={url}
                  id={url}
                  url={url}
                  isMain={index === 0}
                  onRemove={handleRemove}
                  onSetMain={handleSetMain}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// One sortable gallery tile.
// ---------------------------------------------------------------------------

function SortableGalleryImage({
  id,
  url,
  isMain,
  onRemove,
  onSetMain,
}: {
  id: string;
  url: string;
  isMain: boolean;
  onRemove: (url: string) => void;
  onSetMain: (url: string) => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group border-2 rounded-lg overflow-hidden bg-card',
        isMain ? 'border-primary' : 'border-border'
      )}
    >
      <div className="aspect-square relative">
        <Image
          src={url}
          alt={t('productForm.images.alt')}
          fill
          className="object-cover"
          sizes="200px"
        />
      </div>

      {/* Main badge */}
      {isMain && (
        <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
          <Star className="h-3 w-3 fill-current" />
          {t('productForm.images.mainBadge')}
        </span>
      )}

      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute bottom-2 left-2 z-10 flex h-7 w-7 cursor-grab items-center justify-center rounded bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
        title={t('productForm.images.dragTitle')}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Set as main */}
      {!isMain && (
        <button
          type="button"
          onClick={() => onSetMain(url)}
          className="absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded bg-black/50 text-white opacity-0 transition-opacity hover:bg-primary group-hover:opacity-100"
          title={t('productForm.images.setMainTitle')}
        >
          <Star className="h-4 w-4" />
        </button>
      )}

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(url)}
        className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
        title={t('productForm.images.removeTitle')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
