import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { PageForm, type EditablePage, type FormOpt } from '../../page-form';

export const dynamic = 'force-dynamic';

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect('/sign-in');

  // depth=0 keeps relationships (form, media) as ids so the layout is writable
  // as-is; locale=all gives per-locale layout/title/meta; draft=true edits latest.
  let page: EditablePage | null = null;
  try {
    page = await api.blog.get<EditablePage>('pages', id, { locale: 'all', depth: 0, draft: true }, token);
  } catch {
    page = null;
  }

  let forms: FormOpt[] = [];
  try {
    const r = await api.blog.list<{ id: number | string; title?: string }>('forms', { limit: 50, depth: 0 }, token);
    forms = (r.docs || []).map((f) => ({ id: f.id, title: f.title || String(f.id) }));
  } catch {
    forms = [];
  }

  if (!page) {
    return <div className="p-6 text-muted-foreground">Not found</div>;
  }

  return <PageForm page={page} forms={forms} />;
}
