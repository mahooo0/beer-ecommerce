'use client';

import Image from 'next/image';
import type { CartItem } from '@repo/types';
import { formatPrice } from '@/lib/utils';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const variantText = item.attributes
    ? Object.entries(item.attributes)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    : null;

  return (
    <div className="flex items-start gap-4 border-b border-neutral-100 py-4 last:border-0">
      {/* Thumbnail */}
      <div className="relative size-16 shrink-0 overflow-hidden bg-neutral-50">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-neutral-300">
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">{item.name}</p>
        {variantText && (
          <p className="mt-0.5 text-xs text-neutral-500">{variantText}</p>
        )}
        {item.sku && (
          <p className="mt-0.5 text-xs text-neutral-400">{item.sku}</p>
        )}

        {/* Quantity stepper */}
        <div className="mt-2 flex items-center gap-0">
          <button
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            disabled={item.quantity <= 1}
            aria-label="Decrease quantity"
            className="flex size-7 items-center justify-center border border-neutral-300 text-sm text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            -
          </button>
          <span className="flex size-7 items-center justify-center border-y border-neutral-300 text-xs font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            aria-label="Increase quantity"
            className="flex size-7 items-center justify-center border border-neutral-300 text-sm text-neutral-600 transition hover:bg-neutral-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-sm font-semibold text-neutral-900">
          {formatPrice(item.price * item.quantity)}
        </span>
        <button
          onClick={onRemove}
          aria-label={`Remove ${item.name} from cart`}
          className="text-neutral-400 transition hover:text-neutral-900"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
