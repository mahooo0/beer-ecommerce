import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { PromoBannersPageClient } from './promo-banners-page-client';

export default async function PromoBannersPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect('/sign-in');
  }

  const [bannersRes, productsRes] = await Promise.all([
    api.promoBanners.getAll({ token }),
    api.products.getAll({ limit: 500, token }),
  ]);

  const banners = bannersRes.data || [];
  // A lightweight {id,name} list feeds the "link to product" picker.
  const products = (productsRes.data || []).map((p) => ({ id: p.id, name: p.name }));

  return <PromoBannersPageClient banners={banners} products={products} />;
}
