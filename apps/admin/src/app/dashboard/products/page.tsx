import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Product } from '@repo/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { AnalyticsPanel, StatCard, MiniBar } from '@/components/AnalyticsPanel';
import { Package, Eye, Archive, DollarSign } from 'lucide-react';
import { ProductsFilters } from './products-filters';
import { ProductRowActions } from './product-row-actions';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    productType?: string;
    search?: string;
    categoryId?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

const typeColors: Record<string, string> = {
  SIMPLE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  VARIABLE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  WEIGHTED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  DIGITAL: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  BUNDLED: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
};

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function ProductsPage(props: PageProps) {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect('/sign-in');
  }

  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const status = searchParams.status;
  const productType = searchParams.productType;
  const search = searchParams.search;
  const categoryId = searchParams.categoryId;
  const sortBy = searchParams.sortBy;
  const sortOrder = searchParams.sortOrder;

  const [response, categoriesRes] = await Promise.all([
    api.products.getAll({
      page,
      limit: 20,
      status,
      productType,
      search,
      categoryId,
      sortBy,
      sortOrder,
      token,
    }),
    api.categories.getAll(token),
  ]);

  const products = response.data || [];
  const totalPages = response.totalPages || 1;
  const categories = categoriesRes.data || [];

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  // Build query string helper for pagination
  function buildQuery(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { page: String(page), status, productType, search, categoryId, sortBy, sortOrder, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    return params.toString();
  }

  // Compute stats
  const totalProducts = response.total || products.length;
  const activeCount = products.filter((p: Product) => p.status === 'ACTIVE').length;
  const draftCount = products.filter((p: Product) => p.status === 'DRAFT').length;
  const archivedCount = products.filter((p: Product) => p.status === 'ARCHIVED').length;

  const typeBreakdown: Record<string, number> = {};
  products.forEach((p: Product) => {
    typeBreakdown[p.productType] = (typeBreakdown[p.productType] || 0) + 1;
  });

  const avgPrice = products.length > 0
    ? Math.round(products.reduce((sum: number, p: Product) => sum + p.price, 0) / products.length)
    : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/dashboard/products/new">Add Product</Link>
        </Button>
      </div>

      {/* Analytics */}
      <div className="mb-6">
        <AnalyticsPanel title="Product Analytics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Total Products" value={totalProducts} icon={<Package className="h-4 w-4 text-blue-600" />} color="bg-blue-50" />
            <StatCard label="Active" value={activeCount} icon={<Eye className="h-4 w-4 text-green-600" />} color="bg-green-50" />
            <StatCard label="Draft" value={draftCount} icon={<Archive className="h-4 w-4 text-yellow-600" />} color="bg-yellow-50" />
            <StatCard label="Avg Price" value={formatCurrency(avgPrice)} icon={<DollarSign className="h-4 w-4 text-emerald-600" />} color="bg-emerald-50" />
          </div>
          <div className="space-y-2">
            {Object.entries(typeBreakdown).map(([type, count]) => (
              <MiniBar key={type} label={type} value={count} max={products.length} color={typeColors[type]?.split(' ')[0] || 'bg-gray-500'} />
            ))}
          </div>
        </AnalyticsPanel>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <ProductsFilters
          initialValues={{
            search: search || '',
            status: status || '',
            productType: productType || '',
            categoryId: categoryId || '',
            sortBy: sortBy || '',
            sortOrder: sortOrder || '',
          }}
          categoryOptions={categoryOptions}
        />
      </div>

      {/* Products table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product: Product) => (
              <TableRow key={product.id} className="hover:bg-muted/50">
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                        No img
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-foreground">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.slug}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground font-mono">
                  {product.sku}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge
                    variant="secondary"
                    className={typeColors[product.productType] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}
                  >
                    {product.productType}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-foreground">
                  {formatCurrency(product.price)}
                  {product.compareAtPrice && (
                    <span className="ml-2 text-xs text-muted-foreground line-through">
                      {formatCurrency(product.compareAtPrice)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge
                    variant="secondary"
                    className={statusColors[product.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}
                  >
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {(product as any).category?.name || '-'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  <ProductRowActions productId={product.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {products.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No products found.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/products?${buildQuery({ page: String(page - 1) })}`}>
                Previous
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/products?${buildQuery({ page: String(page + 1) })}`}>
                Next
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
