'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableImage } from './sortable-image';
import { ImageUpload } from '../ui/image-upload';

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
  // Set up drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Handle drag end event
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

  // Handle image removal
  const handleRemove = (url: string) => {
    onChange(images.filter((img) => img !== url));
  };

  return (
    <div className="space-y-4">
      {/* Upload with cropping */}
      <ImageUpload
        value={images}
        onChange={(val) => onChange(val as string[])}
        preset="product"
        multiple
        maxFiles={maxFiles}
      />

      {/* Sortable images grid (drag-and-drop reordering) */}
      {images.length > 1 && (
        <>
          <p className="text-xs text-gray-500">Drag to reorder images. First image is the main product image.</p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((url) => (
                  <SortableImage
                    key={url}
                    id={url}
                    url={url}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}
