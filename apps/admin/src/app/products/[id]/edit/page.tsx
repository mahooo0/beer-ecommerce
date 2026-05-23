import { notFound } from 'next/navigation';
import { prisma } from '@repo/db/prisma';
import { ProductForm } from '@/components/product/product-form';
import type { ProductFormData } from '@repo/types';

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  // Fetch product with all relations
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          options: {
            include: {
              option: {
                include: {
                  group: true,
                },
              },
            },
          },
        },
      },
      weightedMeta: true,
      digitalMeta: true,
      bundleItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      },
      tags: {
        select: {
          tagId: true,
        },
      },
      collections: {
        select: {
          collectionId: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Fetch reference data
  const [categories, brands, optionGroups, products] = await Promise.all([
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

    prisma.brand.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),

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

  // Transform product data to form shape
  const defaultValues: Partial<ProductFormData> = {
    productType: product.productType as any,
    name: product.name,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    categoryId: product.categoryId,
    brandId: product.brandId ?? undefined,
    status: product.status as any,
    images: product.images,
    sku: product.sku,
    attributes: product.attributes as Record<string, any>,
    isActive: product.isActive,
    tagIds: product.tags.map((t: any) => t.tagId),
    collectionIds: product.collections.map((c: any) => c.collectionId),
  };

  // Add type-specific data
  if (product.productType === 'VARIABLE' && product.variants.length > 0) {
    (defaultValues as any).variants = product.variants.map((variant: any) => ({
      sku: variant.sku,
      price: variant.price,
      stock: variant.stock,
      isActive: variant.isActive,
      images: variant.images,
      options: variant.options.map((opt: any) => ({
        groupId: opt.option.groupId,
        valueId: opt.optionId,
      })),
    }));
  }

  if (product.productType === 'WEIGHTED' && product.weightedMeta) {
    (defaultValues as any).weightedMeta = {
      unit: product.weightedMeta.unit,
      pricePerUnit: product.weightedMeta.pricePerUnit,
      minWeight: product.weightedMeta.minWeight ?? undefined,
      maxWeight: product.weightedMeta.maxWeight ?? undefined,
      stepWeight: product.weightedMeta.stepWeight ?? undefined,
    };
  }

  if (product.productType === 'DIGITAL' && product.digitalMeta) {
    (defaultValues as any).digitalMeta = {
      fileUrl: product.digitalMeta.fileUrl,
      fileName: product.digitalMeta.fileName,
      fileSize: product.digitalMeta.fileSize,
      fileFormat: product.digitalMeta.fileFormat,
      maxDownloads: product.digitalMeta.maxDownloads ?? undefined,
      accessDuration: product.digitalMeta.accessDuration ?? undefined,
    };
  }

  if (product.productType === 'BUNDLED' && product.bundleItems.length > 0) {
    (defaultValues as any).bundleItems = product.bundleItems.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      discount: item.discount,
    }));
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Product: {product.name}</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update product information and settings
        </p>
      </div>

      <ProductForm
        defaultValues={defaultValues}
        categories={categories}
        brands={brands}
        optionGroups={optionGroups as any}
        products={products}
        isEdit={true}
        productId={product.id}
      />
    </div>
  );
}
