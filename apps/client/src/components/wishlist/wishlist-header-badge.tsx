'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useWishlistSync } from '@/hooks/use-wishlist-sync';

/**
 * Header entry point for the wishlist: links to /wishlist, shows a live count
 * badge, and (via useWishlistSync) pulls a signed-in user's server wishlist
 * into the local store. Styled to sit in the Taranka header's icon strip.
 */
export function WishlistHeaderBadge() {
  const { t } = useTranslation('misc');
  const [mounted, setMounted] = useState(false);
  const totalItems = useWishlistStore((s) => s.totalItems);

  useWishlistSync();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only trust the persisted store after mount to avoid an SSR hydration mismatch.
  const count = mounted ? totalItems() : 0;

  return (
    <Link
      href="/wishlist"
      aria-label={count > 0 ? t('wishlist.badge.ariaCount', { n: count }) : t('wishlist.badge.aria')}
      className="group/icon relative flex h-full w-12 items-center justify-center text-ink-900 transition-colors hover:text-brand-red-500"
    >
      <Heart
        className="size-5 transition-transform duration-300 group-hover/icon:scale-110"
        strokeWidth={1.75}
      />
      {count > 0 && (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red-500 px-1 text-[10px] font-bold leading-none text-cream-50">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
