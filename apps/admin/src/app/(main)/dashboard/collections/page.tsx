import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import type { Product } from '@repo/types';
import ProductSelector from './product-selector';
import { CollectionsPageClient } from './collections-page-client';

interface PageProps {
  searchParams: Promise<{
    action?: string;
    id?: string;
  }>;
}

export default async function CollectionsPage(props: PageProps) {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect('/sign-in');
  }

  const searchParams = await props.searchParams;
  const action = searchParams.action;
  const id = searchParams.id;

  // Fetch collections
  const collectionsResponse = await api.collections.getAll({ token });
  const collections = collectionsResponse.data || [];

  // Handle product selector action (kept as query param driven)
  if (action === 'products' && id) {
    let selectedCollection = null;
    let products: Product[] = [];

    try {
      const response = await api.collections.getById(id, token);
      selectedCollection = response.data || null;
    } catch (error) {
      console.error('Failed to fetch collection:', error);
    }

    if (selectedCollection) {
      try {
        const productsResponse = await api.products.getAll({ token });
        products = productsResponse.data || [];
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }

      return (
        <div className="space-y-6">
          <div className="p-4 bg-card rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Manage Products in &quot;{selectedCollection.name}&quot;
            </h2>
            <ProductSelector
              collectionId={selectedCollection.id}
              products={products}
            />
          </div>
        </div>
      );
    }
  }

  return <CollectionsPageClient collections={collections} />;
}
