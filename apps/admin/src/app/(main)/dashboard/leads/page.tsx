import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { LeadsPageClient, type AdminSubmission } from './leads-page-client';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect('/sign-in');
  }

  // Form-builder submissions (Kontakt / Franczyza). depth=1 populates the
  // related form so we can show its name.
  let submissions: AdminSubmission[] = [];
  try {
    const res = await api.blog.list<AdminSubmission>(
      'form-submissions',
      { depth: 1, limit: 200, sort: '-createdAt' },
      token,
    );
    submissions = res.docs || [];
  } catch {
    submissions = [];
  }

  return <LeadsPageClient submissions={submissions} />;
}
