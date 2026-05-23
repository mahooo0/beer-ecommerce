import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { ProductForm } from '@/components/product/product-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage(props: PageProps) {
  const { id } = await props.params;
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect('/sign-in');
  }

  let product: any;
  try {
    const productRes = await api.products.getById(id, token);
    product = productRes.data;
  } catch {
    notFound();
  }

  if (!product) {
    notFound();
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

  const productsList = (productsRes.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
  }));

  const defaultValues = {
    productType: product.productType,
    name: product.name,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    sku: product.sku,
    categoryId: product.categoryId,
    brandId: product.brandId,
    status: product.status,
    images: product.images || [],
    attributes: product.attributes || {},
    isActive: product.isActive,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <ProductForm
        isEdit
        productId={id}
        defaultValues={defaultValues}
        categories={categories}
        brands={brands}
        optionGroups={optionGroups}
        products={productsList}
      />
    </div>
  );
}
