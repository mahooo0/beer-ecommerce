import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import { WishlistPageClient } from './wishlist-page-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT('misc');
  return {
    title: t('wishlist.title'),
  };
}

export default function WishlistPage() {
  return <WishlistPageClient />;
}
