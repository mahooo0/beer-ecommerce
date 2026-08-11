import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { ProductForm } from '@/components/product/product-form';

export default async function NewProductPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect('/sign-in');
  }

  // The flat form only needs brands for the (optional) brand select. Categories
  // are loaded client-side by CategoryPicker via react-query; attributes by the
  // ProductAttributeFields hook.
  const brandsRes = await api.brands.getAll({ token, limit: 200 });

  const brands = (brandsRes.data || []).map((b: any) => ({
    id: b.id,
    name: b.name,
  }));

  return (
    <div>
      <ProductForm brands={brands} />
    </div>
  );
}
