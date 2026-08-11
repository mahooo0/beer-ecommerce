import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { ProductForm } from '@/components/product/product-form';
import type { ProductFormData } from '@repo/types';

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

  const brandsRes = await api.brands.getAll({ token, limit: 200 });
  const brands = (brandsRes.data || []).map((b: any) => ({
    id: b.id,
    name: b.name,
  }));

  // Map the persisted product onto the flat form shape. attributeValues come as
  // junction rows { attributeId, attributeValueId } — the form expects exactly
  // that flat pair array.
  const attributeValues = (product.attributeValues || []).map((av: any) => ({
    attributeId: av.attributeId,
    attributeValueId: av.attributeValueId,
  }));

  const defaultValues: Partial<ProductFormData> = {
    name: product.name ?? '',
    description: product.description ?? '',
    price: product.price ?? 0,
    salePrice: product.salePrice ?? null,
    categoryId: product.categoryId ?? '',
    brandId: product.brandId ?? undefined,
    status: product.status ?? 'DRAFT',
    images: product.images || [],
    slug: product.slug ?? '',
    baseUnit: product.baseUnit ?? 'piece',
    manufacturer: product.manufacturer ?? '',
    composition: product.composition ?? '',
    searchKeywords: product.searchKeywords || [],
    trackQuantity: product.trackQuantity ?? false,
    quantity: product.quantity ?? 0,
    isAvailable: product.isAvailable ?? true,
    isActive: product.isActive ?? true,
    attributes: product.attributes || {},
    attributeValues,
    wholesaleTiers: product.wholesaleTiers ?? [],
  };

  return (
    <div>
      <ProductForm
        isEdit
        productId={id}
        defaultValues={defaultValues}
        brands={brands}
      />
    </div>
  );
}
