import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { CategoriesPageClient, type AdminCategory } from './categories-page-client';

export const dynamic = 'force-dynamic';

export default async function BlogCategoriesPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect('/sign-in');
  }

  let categories: AdminCategory[] = [];
  try {
    const res = await api.blog.list<AdminCategory>(
      'categories',
      { locale: 'all', limit: 200, sort: 'slug', depth: 0 },
      token,
    );
    categories = res.docs || [];
  } catch {
    categories = [];
  }

  return <CategoriesPageClient categories={categories} />;
}
