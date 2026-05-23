import { prisma } from '@repo/db/prisma';
import { ProductForm } from '@/components/product/product-form';

export default async function NewProductPage() {
  // Fetch reference data for the form
  const [categories, brands, optionGroups, products] = await Promise.all([
    // Categories with path for display
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        path: true,
      },
      orderBy: {
        path: 'asc',
      },
    }),

    // Brands
    prisma.brand.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),

    // Option groups with values
    prisma.optionGroup.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        values: {
          select: {
            id: true,
            value: true,
            label: true,
          },
          orderBy: {
            value: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),

    // Products for bundle selection (only active products, basic info)
    prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
        <p className="mt-2 text-sm text-gray-600">
          Add a new product to your catalog
        </p>
      </div>

      <ProductForm
        categories={categories}
        brands={brands}
        optionGroups={optionGroups as any}
        products={products}
      />
    </div>
  );
}
