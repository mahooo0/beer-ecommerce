import type { Metadata } from 'next';
import { CmsPageView, cmsPageMetadata } from '@/components/taranka/cms-page';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Promise<Metadata> {
  return cmsPageMetadata('contacts');
}

export default function ContactsPage() {
  return <CmsPageView slug="contacts" />;
}
