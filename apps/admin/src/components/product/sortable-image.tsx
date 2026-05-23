'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';

interface SortableImageProps {
  id: string;
  url: string;
  onRemove: (url: string) => void;
}

export function SortableImage({ id, url, onRemove }: SortableImageProps) {
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
      className="relative group border-2 border-gray-200 rounded-lg overflow-hidden bg-white"
    >
      {/* Image */}
      <div className="aspect-square relative">
        <Image
          src={url}
          alt="Product image"
          fill
          className="object-cover"
          sizes="200px"
        />
      </div>

      {/* Drag handle - entire image is draggable */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-move"
        title="Drag to reorder"
      />

      {/* Remove button - appears on hover */}
      <button
        type="button"
        onClick={() => onRemove(url)}
        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Remove image"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
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
  );
}
