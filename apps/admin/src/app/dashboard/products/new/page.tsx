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

  const [categoriesRes, brandsRes, productsRes] = await Promise.all([
    api.categories.getAll(token),
    api.brands.getAll({ token }),
    api.products.getAll({ token, limit: 100 }),
  ]);

  let optionGroups: any[] = [];
  try {
    const ogRes = await api.optionGroups.getAll(token);
    optionGroups = ogRes.data || [];
  } catch {
    // Option groups endpoint may not exist yet
  }

  const categories = (categoriesRes.data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    path: c.name,
  }));

  const brands = (brandsRes.data || []).map((b: any) => ({
    id: b.id,
    name: b.name,
  }));

  const products = (productsRes.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Product</h1>
      <ProductForm
        categories={categories}
        brands={brands}
        optionGroups={optionGroups}
        products={products}
      />
    </div>
  );
}
