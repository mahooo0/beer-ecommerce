import { auth } from '@clerk/nextjs/server';
import { api } from '@/lib/api';
import AttributeManager from './attribute-manager';
import { CategoriesPageClient } from './categories-page-client';

interface SearchParams {
  action?: string;
  id?: string;
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { getToken } = await auth();
  const token = await getToken();
  const params = await searchParams;

  if (!token) {
    return <div>Not authenticated</div>;
  }

  // Fetch all categories
  const response = await api.categories.getAll(token);
  const categories = response.data || [];

  // Handle attribute manager (kept as query param driven)
  if (params.action === 'attributes' && params.id) {
    let selectedCategory = null;
    let categoryAttributes: any[] = [];

    const categoryResponse = await api.categories.getById(params.id, token);
    selectedCategory = categoryResponse.data || null;
    if (selectedCategory) {
      categoryAttributes = selectedCategory.attributes || [];
    }

    if (selectedCategory) {
      return (
        <div className="space-y-6">
          <CategoriesPageClient categories={categories} />
          <div className="bg-card rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">
              Manage Attributes: {selectedCategory.name}
            </h2>
            <AttributeManager
              categoryId={selectedCategory.id}
              attributes={categoryAttributes}
            />
          </div>
        </div>
      );
    }
  }

  return <CategoriesPageClient categories={categories} />;
}
