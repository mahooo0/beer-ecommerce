import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { PagesListClient, type AdminPage } from './pages-list-client';

export const dynamic = 'force-dynamic';

export default async function PagesPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect('/sign-in');

  let pages: AdminPage[] = [];
  try {
    const r = await api.blog.list<AdminPage>('pages', { locale: 'all', limit: 50, sort: 'slug', depth: 0 }, token);
    pages = r.docs || [];
  } catch {
    pages = [];
  }

  return <PagesListClient pages={pages} />;
}
