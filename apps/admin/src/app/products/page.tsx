import { auth } from '@clerk/nextjs/server';
import { ProductsTable } from '@/components/product/products-table';
import { api } from '@/lib/api';

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    productType?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { getToken } = await auth();
  const token = await getToken();

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '25', 10);
  const status = params.status;
  const productType = params.productType;
  const search = params.search;
  const sortBy = params.sortBy;
  const sortOrder = params.sortOrder;

  try {
    const response = await api.products.getAll({
      page,
      limit,
      status,
      productType,
      search,
      sortBy,
      sortOrder,
      token: token || undefined,
    });

    const products = response.data || [];
    const total = response.total || 0;
    const totalPages = response.totalPages || 1;

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-600">
            {total} {total === 1 ? 'product' : 'products'} total
          </p>
        </div>

        <ProductsTable
          data={products}
          pageCount={totalPages}
          pageIndex={page}
          pageSize={limit}
          total={total}
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">
            Failed to load products: {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }
}
