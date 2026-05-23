'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';
import { formatPrice } from '@/lib/utils';
import { CartItemRow } from './cart-item-row';

interface MiniCartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MiniCartDrawer({ open, onClose }: MiniCartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const totalItems = useCartStore((s) => s.totalItems);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-xl transition-transform duration-300 sm:max-w-md ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">
          <h2 className="text-xs font-semibold tracking-[0.2em] text-neutral-900 uppercase">
            Cart ({totalItems()})
          </h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="text-neutral-400 transition hover:text-neutral-900"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable item list */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12 text-center">
              <svg className="size-16 text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-sm font-medium text-neutral-500">Your cart is empty</p>
              <Link
                href="/"
                onClick={onClose}
                className="text-xs font-medium tracking-wider text-neutral-900 uppercase underline underline-offset-4 transition hover:no-underline"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <CartItemRow
                key={`${item.productId}-${item.variantId ?? 'no-variant'}`}
                item={item}
                onUpdateQuantity={(qty) =>
                  updateQuantity(item.productId, item.variantId ?? '', qty)
                }
                onRemove={() => removeItem(item.productId, item.variantId ?? '')}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-neutral-200 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-wider text-neutral-500 uppercase">Subtotal</span>
              <span className="text-base font-semibold text-neutral-900">
                {formatPrice(subtotal())}
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                href="/cart"
                onClick={onClose}
                className="flex-1 border border-neutral-300 py-3 text-center text-xs font-medium tracking-wider text-neutral-900 uppercase transition hover:bg-neutral-50"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex-1 bg-neutral-900 py-3 text-center text-xs font-medium tracking-wider text-white uppercase transition hover:bg-neutral-800"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
