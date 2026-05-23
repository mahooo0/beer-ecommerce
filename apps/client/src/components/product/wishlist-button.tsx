'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useWishlistStore } from '../../stores/wishlist-store';
import { api } from '@/lib/api';

interface WishlistButtonProps {
  productId: string;
  price: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function WishlistButton({ productId, price, size = 'md', className = '' }: WishlistButtonProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useWishlistStore((s) => s.items);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const addItem = useWishlistStore((s) => s.addItem);
  const removeItem = useWishlistStore((s) => s.removeItem);

  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  const isInWishlist = mounted ? items.some((i) => i.productId === productId) : false;

  const iconSize = size === 'sm' ? 'size-4' : 'size-5';

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const wasInWishlist = items.some((i) => i.productId === productId);

    toggleItem(productId, price);

    if (isSignedIn) {
      try {
        const token = await getToken();
        if (!token) return;
        if (wasInWishlist) {
          await api.wishlist.removeItem(productId, token);
        } else {
          await api.wishlist.addItem(productId, price, token);
        }
      } catch {
        if (wasInWishlist) {
          addItem({ productId, priceAtAdd: price });
        } else {
          removeItem(productId);
        }
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`flex items-center justify-center rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition hover:bg-white ${className}`}
    >
      <svg
        className={`${iconSize} transition-colors duration-200 ${
          isInWishlist ? 'fill-neutral-900 text-neutral-900' : 'fill-none text-neutral-400 hover:text-neutral-700'
        }`}
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
