import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { LoyaltyTiersPageClient } from './loyalty-tiers-page-client';

export default async function LoyaltyTiersPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect('/sign-in');
  }

  const tiersRes = await api.loyaltyTiers.getAll({ token });
  const tiers = tiersRes.data || [];

  return <LoyaltyTiersPageClient tiers={tiers} />;
}
