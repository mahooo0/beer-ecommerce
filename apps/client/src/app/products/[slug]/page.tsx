import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import type { ProductDetail } from '@/types/product-detail';
import { ProductPageClient } from './product-page-client';
import { DigitalProductInfo } from '@/components/product/digital-product-info';
import { BundleItemsList } from '@/components/product/bundle-items-list';
import { ProductSpecsTable } from '@/components/product/product-specs-table';
import { ReviewsPlaceholder } from '@/components/product/reviews-placeholder';
import { RelatedProductsCarousel } from '@/components/product/related-products-carousel';
import { FrequentlyBoughtTogether } from '@/components/product/frequently-bought-together';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await api.products.getBySlug(slug);
    const product = (res as { data?: ProductDetail }).data ?? (res as unknown as ProductDetail);
    if (!product) return { title: 'Product Not Found' };
    return {
      title: product.name,
      description: product.description?.slice(0, 160) ?? undefined,
    };
  } catch {
    return { title: 'Product Not Found' };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  let product: ProductDetail;
  try {
    const res = await api.products.getBySlug(slug);
    const data = (res as { data?: ProductDetail }).data ?? (res as unknown as ProductDetail);
    if (!data) notFound();
    product = data;
  } catch {
    notFound();
  }

  // Fetch related and FBT in parallel -- gracefully degrade on failure
  const [relatedResult, fbtResult] = await Promise.allSettled([
    api.products.getRelated(product.id),
    api.products.getFrequentlyBoughtTogether(product.id),
  ]);

  const relatedProducts =
    relatedResult.status === 'fulfilled'
      ? ((relatedResult.value as { data?: unknown[] }).data ?? [])
      : [];

  const fbtProducts =
    fbtResult.status === 'fulfilled'
      ? ((fbtResult.value as { data?: unknown[] }).data ?? [])
      : [];

  const isDigital = product.productType === 'DIGITAL';
  const isBundled = product.productType === 'BUNDLED';

  // Category attributes for specs table
  const categoryAttributes = (
    product.category as { attributes?: Array<{ name: string; displayName: string }> }
  )?.attributes ?? [];

  // Product attributes (JSONB)
  const productAttributes =
    (product.attributes as Record<string, unknown> | null) ?? {};
  const hasAttributes = Object.keys(productAttributes).length > 0;

  // Current product data for FBT component
  const currentProductForFbt = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.images[0] ?? '',
    sku: product.sku ?? '',
  };

  return (
    <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-8">
      {/* Above the fold: client island */}
      <ProductPageClient product={product} />

      {/* Below the fold: server-rendered sections */}
      <div className="mt-16 space-y-12 border-t border-neutral-200 pt-12">
        {/* Digital product info */}
        {isDigital && product.digitalMeta && (
          <section>
            <DigitalProductInfo
              fileFormat={product.digitalMeta.fileFormat}
              fileSize={product.digitalMeta.fileSize}
              maxDownloads={product.digitalMeta.maxDownloads ?? undefined}
              expiryDays={product.digitalMeta.accessDuration ?? undefined}
            />
          </section>
        )}

        {/* Bundle items */}
        {isBundled && product.bundleItems && product.bundleItems.length > 0 && (
          <section>
            <BundleItemsList
              bundleItems={product.bundleItems.map((item) => ({
                product: item.product,
                quantity: item.quantity,
              }))}
              bundlePrice={product.price}
            />
          </section>
        )}

        {/* Specifications table */}
        {hasAttributes && (
          <ProductSpecsTable
            attributes={productAttributes}
            categoryAttributes={categoryAttributes}
          />
        )}

        {/* Reviews */}
        <ReviewsPlaceholder
          averageRating={(product as { averageRating?: number }).averageRating ?? 0}
          reviewCount={(product as { reviewCount?: number }).reviewCount ?? 0}
        />

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <RelatedProductsCarousel products={relatedProducts as Parameters<typeof RelatedProductsCarousel>[0]['products']} />
        )}

        {/* Frequently bought together */}
        {fbtProducts.length > 0 && (
          <FrequentlyBoughtTogether
            products={fbtProducts as Parameters<typeof FrequentlyBoughtTogether>[0]['products']}
            currentProduct={currentProductForFbt}
          />
        )}
      </div>
    </div>
  );
}
