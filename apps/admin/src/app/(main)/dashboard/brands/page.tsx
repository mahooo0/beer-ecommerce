import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { BrandsPageClient } from './brands-page-client';

export default async function BrandsPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect('/sign-in');
  }

  const brandsResponse = await api.brands.getAll({ token });
  const brands = brandsResponse.data || [];

  return <BrandsPageClient brands={brands} />;
}
