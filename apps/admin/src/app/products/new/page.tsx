import { prisma } from '@repo/db/prisma';
import { ProductForm } from '@/components/product/product-form';

// NOTE: legacy route — the live product form lives at
// app/(main)/dashboard/products/new. Kept compiling against the new flat
// ProductForm signature (brands only). Categories/attributes load client-side.
export default async function NewProductPage() {
  const brands = await prisma.brand.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Product</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a new product to your catalog
        </p>
      </div>

      <ProductForm brands={brands} />
    </div>
  );
}
