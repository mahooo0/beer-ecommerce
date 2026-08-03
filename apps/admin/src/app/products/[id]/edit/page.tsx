import { notFound } from 'next/navigation';
import { prisma } from '@repo/db/prisma';
import { ProductForm } from '@/components/product/product-form';
import type { ProductFormData } from '@repo/types';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

// NOTE: legacy route — the live product form lives at
// app/(main)/dashboard/products/[id]. Kept compiling against the new flat
// ProductForm signature (no variants/weighted/digital/bundle).
export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      attributeValues: {
        select: { attributeId: true, attributeValueId: true },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const brands = await prisma.brand.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const defaultValues: Partial<ProductFormData> = {
    name: product.name,
    description: product.description,
    price: product.price,
    salePrice: (product as any).salePrice ?? null,
    categoryId: product.categoryId,
    brandId: product.brandId ?? undefined,
    status: product.status as ProductFormData['status'],
    images: product.images,
    slug: product.slug ?? '',
    baseUnit: (product as any).baseUnit ?? 'piece',
    manufacturer: (product as any).manufacturer ?? '',
    composition: (product as any).composition ?? '',
    searchKeywords: (product as any).searchKeywords ?? [],
    trackQuantity: (product as any).trackQuantity ?? false,
    quantity: (product as any).quantity ?? 0,
    isAvailable: (product as any).isAvailable ?? true,
    isActive: product.isActive,
    attributes: product.attributes as Record<string, any>,
    attributeValues: ((product as any).attributeValues ?? []).map((av: any) => ({
      attributeId: av.attributeId,
      attributeValueId: av.attributeValueId,
    })),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Product: {product.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Update product information and settings
        </p>
      </div>

      <ProductForm
        defaultValues={defaultValues}
        brands={brands}
        isEdit
        productId={product.id}
      />
    </div>
  );
}
