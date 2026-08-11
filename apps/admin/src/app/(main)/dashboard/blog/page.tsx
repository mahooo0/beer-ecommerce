import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { BlogPostsPageClient, type AdminPost } from './blog-posts-page-client';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect('/sign-in');
  }

  // locale=all returns localized fields (title, category titles) as {pl,uk}
  // objects so the client can toggle language without a refetch. The API key
  // (applied server-side by the proxy) means drafts are included too.
  let posts: AdminPost[] = [];
  try {
    const res = await api.blog.list<AdminPost>(
      'posts',
      { locale: 'all', depth: 1, limit: 100, sort: '-updatedAt' },
      token,
    );
    posts = res.docs || [];
  } catch {
    posts = [];
  }

  return <BlogPostsPageClient posts={posts} />;
}
