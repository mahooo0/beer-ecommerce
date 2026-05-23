import { Suspense } from 'react';
import { SearchResultsPage } from '@/components/search/search-results-page';

export const metadata = {
  title: 'Search Products',
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <SearchResultsPage />
    </Suspense>
  );
}
