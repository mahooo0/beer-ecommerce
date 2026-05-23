import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { CheckoutPageClient } from './checkout-page-client';

export default async function CheckoutPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/checkout');
  }
  return <CheckoutPageClient />;
}
