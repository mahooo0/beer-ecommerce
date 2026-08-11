import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { PostForm, type CategoryOpt } from '../post-form';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect('/sign-in');

  let categories: CategoryOpt[] = [];
  try {
    const r = await api.blog.list<{ id: number | string; title?: string; slug?: string }>(
      'categories',
      { locale: 'pl', limit: 200, depth: 0, sort: 'title' },
      token,
    );
    categories = (r.docs || []).map((c) => ({ id: c.id, title: c.title || c.slug || String(c.id) }));
  } catch {
    categories = [];
  }

  return <PostForm categories={categories} />;
}
