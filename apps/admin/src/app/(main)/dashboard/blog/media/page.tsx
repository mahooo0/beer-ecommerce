import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { MediaPageClient, type AdminMedia } from './media-page-client';

export const dynamic = 'force-dynamic';

export default async function BlogMediaPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect('/sign-in');

  let media: AdminMedia[] = [];
  try {
    const r = await api.blog.list<AdminMedia>('media', { limit: 100, sort: '-createdAt', depth: 0 }, token);
    media = r.docs || [];
  } catch {
    media = [];
  }

  return <MediaPageClient media={media} />;
}
