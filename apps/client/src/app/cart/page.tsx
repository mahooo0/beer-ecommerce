import type { Metadata } from 'next';
import { CartPageClient } from './cart-page-client';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review and manage your shopping cart',
};

export default function CartPage() {
  return <CartPageClient />;
}
