'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { useCartSync } from '@/hooks/use-cart-sync';
import { MiniCartDrawer } from './mini-cart-drawer';

export function CartHeaderButton() {
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);

  useCartSync();

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? totalItems() : 0;

  return (
    <>
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label={`Cart${count > 0 ? ` (${count} items)` : ''}`}
        className="relative flex items-center text-neutral-600 transition hover:text-neutral-900"
      >
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <MiniCartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
