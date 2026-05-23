import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { OrdersListClient } from './orders-list-client';

export default async function OrdersPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/orders');
  }
  return <OrdersListClient />;
}
