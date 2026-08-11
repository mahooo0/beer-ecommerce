import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import { SearchResultsPage } from '@/components/search/search-results-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT('misc');
  return {
    title: t('search.title'),
  };
}

export default async function SearchPage() {
  const t = await getServerT('misc');
  return (
    <Suspense fallback={<div className="text-center py-12">{t('search.loading')}</div>}>
      <SearchResultsPage />
    </Suspense>
  );
}
