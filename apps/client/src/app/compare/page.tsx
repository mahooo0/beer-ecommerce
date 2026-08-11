import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import { ComparePageClient } from './compare-page-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT('misc');
  return {
    title: t('compare.title'),
  };
}

export default function ComparePage() {
  return <ComparePageClient />;
}
