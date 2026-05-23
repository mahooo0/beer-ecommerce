import type { Metadata } from 'next';
import { WishlistPageClient } from './wishlist-page-client';

export const metadata: Metadata = {
  title: 'My Wishlist',
};

export default function WishlistPage() {
  return <WishlistPageClient />;
}
