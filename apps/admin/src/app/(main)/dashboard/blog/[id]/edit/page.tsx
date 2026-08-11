import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { PostForm, type CategoryOpt, type EditablePost } from '../../post-form';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect('/sign-in');

  // locale=all → localized fields come back as {pl,uk}; draft=true edits the
  // latest (possibly unpublished) version.
  let post: EditablePost | null = null;
  try {
    post = await api.blog.get<EditablePost>('posts', id, { locale: 'all', depth: 1, draft: true }, token);
  } catch {
    post = null;
  }

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

  return <PostForm post={post} categories={categories} />;
}
