import type { ApiResponse, PaginatedResponse, Product, Order, User, ShippingZone, ShippingMethod, Category, CategoryAttribute, Brand, Tag, Collection } from '@repo/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:4001';

async function fetcher<T>(
  url: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${url}`, {
    headers,
    ...fetchOptions,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  products: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      productType?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
      categoryId?: string;
      brandId?: string;
      token?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.limit) queryParams.set('limit', String(params.limit));
      if (params?.status) queryParams.set('status', params.status);
      if (params?.productType) queryParams.set('productType', params.productType);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
      if (params?.categoryId) queryParams.set('categoryId', params.categoryId);
      if (params?.brandId) queryParams.set('brandId', params.brandId);

      const queryString = queryParams.toString();
      const url = `/products${queryString ? `?${queryString}` : ''}`;

      return fetcher<PaginatedResponse<Product>>(url, { token: params?.token });
    },
    getById: (id: string, token?: string) =>
      fetcher<ApiResponse<Product>>(`/products/${id}`, { token }),
    create: (data: Partial<Product>, token?: string) =>
      fetcher<ApiResponse<Product>>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, data: Partial<Product>, token?: string) =>
      fetcher<ApiResponse<Product>>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, token?: string) =>
      fetcher<ApiResponse<void>>(`/products/${id}`, { method: 'DELETE', token }),
    updateStatus: (id: string, status: string, token?: string) =>
      fetcher<ApiResponse<Product>>(`/products/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        token,
      }),
    bulkUpdateStatus: (ids: string[], status: string, token?: string) =>
      fetcher<ApiResponse<{ count: number }>>('/products/bulk/status', {
        method: 'PATCH',
        body: JSON.stringify({ ids, status }),
        token,
      }),
    bulkDelete: (ids: string[], token?: string) =>
      fetcher<ApiResponse<{ count: number }>>('/products/bulk/delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
        token,
      }),
  },
  orders: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      minAmount?: number;
      maxAmount?: number;
      search?: string;
      token?: string;
    }) => {
      const qp = new URLSearchParams();
      if (params?.page) qp.set('page', String(params.page));
      if (params?.limit) qp.set('limit', String(params.limit));
      if (params?.status) qp.set('status', params.status);
      if (params?.dateFrom) qp.set('dateFrom', params.dateFrom);
      if (params?.dateTo) qp.set('dateTo', params.dateTo);
      if (params?.minAmount) qp.set('minAmount', String(params.minAmount));
      if (params?.maxAmount) qp.set('maxAmount', String(params.maxAmount));
      if (params?.search) qp.set('search', params.search);
      const qs = qp.toString();
      return fetcher<PaginatedResponse<Order>>(`/orders${qs ? `?${qs}` : ''}`, { token: params?.token });
    },
    getById: (id: string, token?: string) => fetcher<ApiResponse<Order>>(`/orders/${id}`, { token }),
    updateStatus: (id: string, status: string, token?: string) =>
      fetcher<ApiResponse<Order>>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        token,
      }),
    addTracking: (id: string, data: { carrier: string; trackingNumber: string; estimatedDelivery?: string }, token?: string) =>
      fetcher<ApiResponse<Order>>(`/orders/${id}/tracking`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
    getStats: (token?: string) =>
      fetcher<ApiResponse<{
        totalOrders: number;
        revenue: number;
        avgOrderValue: number;
        byStatus: Record<string, number>;
      }>>('/orders/stats', { token }),
    refund: (id: string, amount?: number, token?: string) =>
      fetcher<ApiResponse<{ id: string; amount: number; status: string }>>(`/orders/${id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
        token,
      }),
  },
  users: {
    getAll: (params?: { page?: number; limit?: number; search?: string; role?: string; token?: string }) => {
      const qp = new URLSearchParams();
      if (params?.page) qp.set('page', String(params.page));
      if (params?.limit) qp.set('limit', String(params.limit));
      if (params?.search) qp.set('search', params.search);
      if (params?.role) qp.set('role', params.role);
      const qs = qp.toString();
      return fetcher<PaginatedResponse<User>>(`/auth/users${qs ? `?${qs}` : ''}`, { token: params?.token });
    },
  },
  shipping: {
    zones: {
      getAll: (token?: string) => fetcher<ApiResponse<ShippingZone[]>>('/shipping/zones', { token }),
      getById: (id: string, token?: string) => fetcher<ApiResponse<ShippingZone & { methods: ShippingMethod[] }>>(`/shipping/zones/${id}`, { token }),
      create: (data: Partial<ShippingZone>, token?: string) => fetcher<ApiResponse<ShippingZone>>('/shipping/zones', { method: 'POST', body: JSON.stringify(data), token }),
      update: (id: string, data: Partial<ShippingZone>, token?: string) => fetcher<ApiResponse<ShippingZone>>(`/shipping/zones/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
      delete: (id: string, token?: string) => fetcher<ApiResponse<void>>(`/shipping/zones/${id}`, { method: 'DELETE', token }),
    },
    methods: {
      create: (zoneId: string, data: Partial<ShippingMethod>, token?: string) => fetcher<ApiResponse<ShippingMethod>>(`/shipping/zones/${zoneId}/methods`, { method: 'POST', body: JSON.stringify(data), token }),
      update: (id: string, data: Partial<ShippingMethod>, token?: string) => fetcher<ApiResponse<ShippingMethod>>(`/shipping/methods/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
      delete: (id: string, token?: string) => fetcher<ApiResponse<void>>(`/shipping/methods/${id}`, { method: 'DELETE', token }),
    },
  },
  categories: {
    getAll: (token?: string) => fetcher<ApiResponse<Category[]>>('/categories', { token }),
    getTree: (token?: string) => fetcher<ApiResponse<Category[]>>('/categories/tree', { token }),
    getById: (id: string, token?: string) => fetcher<ApiResponse<Category & { attributes: CategoryAttribute[], children: Category[] }>>(`/categories/${id}`, { token }),
    create: (data: Partial<Category>, token?: string) => fetcher<ApiResponse<Category>>('/categories', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: Partial<Category>, token?: string) => fetcher<ApiResponse<Category>>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, token?: string) => fetcher<ApiResponse<void>>(`/categories/${id}`, { method: 'DELETE', token }),
    move: (id: string, data: { newParentId: string | null; position: number }, token?: string) => fetcher<ApiResponse<Category>>(`/categories/${id}/move`, { method: 'PATCH', body: JSON.stringify(data), token }),
    reorder: (data: { parentId: string | null; orderedIds: string[] }, token?: string) => fetcher<ApiResponse<void>>('/categories/reorder', { method: 'PATCH', body: JSON.stringify(data), token }),
    // Attributes
    getAttributes: (categoryId: string, token?: string) => fetcher<ApiResponse<CategoryAttribute[]>>(`/categories/${categoryId}/attributes`, { token }),
    createAttribute: (categoryId: string, data: Partial<CategoryAttribute>, token?: string) => fetcher<ApiResponse<CategoryAttribute>>(`/categories/${categoryId}/attributes`, { method: 'POST', body: JSON.stringify(data), token }),
    updateAttribute: (attributeId: string, data: Partial<CategoryAttribute>, token?: string) => fetcher<ApiResponse<CategoryAttribute>>(`/categories/attributes/${attributeId}`, { method: 'PUT', body: JSON.stringify(data), token }),
    deleteAttribute: (attributeId: string, token?: string) => fetcher<ApiResponse<void>>(`/categories/attributes/${attributeId}`, { method: 'DELETE', token }),
  },
  collections: {
    getAll: (params?: { page?: number; limit?: number; token?: string }) => {
      const qp = new URLSearchParams();
      if (params?.page) qp.set('page', String(params.page));
      if (params?.limit) qp.set('limit', String(params.limit));
      const qs = qp.toString();
      return fetcher<PaginatedResponse<Collection>>(`/collections${qs ? `?${qs}` : ''}`, { token: params?.token });
    },
    getById: (id: string, token?: string) => fetcher<ApiResponse<Collection>>(`/collections/${id}`, { token }),
    create: (data: Partial<Collection>, token?: string) => fetcher<ApiResponse<Collection>>('/collections', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: Partial<Collection>, token?: string) => fetcher<ApiResponse<Collection>>(`/collections/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, token?: string) => fetcher<ApiResponse<void>>(`/collections/${id}`, { method: 'DELETE', token }),
    addProduct: (collectionId: string, productId: string, token?: string) => fetcher<ApiResponse<void>>(`/collections/${collectionId}/products`, { method: 'POST', body: JSON.stringify({ productId }), token }),
    removeProduct: (collectionId: string, productId: string, token?: string) => fetcher<ApiResponse<void>>(`/collections/${collectionId}/products/${productId}`, { method: 'DELETE', token }),
  },
  brands: {
    getAll: (params?: { page?: number; limit?: number; token?: string }) => {
      const qp = new URLSearchParams();
      if (params?.page) qp.set('page', String(params.page));
      if (params?.limit) qp.set('limit', String(params.limit));
      const qs = qp.toString();
      return fetcher<PaginatedResponse<Brand>>(`/brands${qs ? `?${qs}` : ''}`, { token: params?.token });
    },
    getById: (id: string, token?: string) => fetcher<ApiResponse<Brand>>(`/brands/${id}`, { token }),
    create: (data: Partial<Brand>, token?: string) => fetcher<ApiResponse<Brand>>('/brands', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: Partial<Brand>, token?: string) => fetcher<ApiResponse<Brand>>(`/brands/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, token?: string) => fetcher<ApiResponse<void>>(`/brands/${id}`, { method: 'DELETE', token }),
  },
  tags: {
    getAll: (params?: { type?: string; token?: string } | string) => {
      const token = typeof params === 'string' ? params : params?.token;
      const type = typeof params === 'string' ? undefined : params?.type;
      const qp = new URLSearchParams();
      if (type) qp.set('type', type);
      const qs = qp.toString();
      return fetcher<ApiResponse<Tag[]>>(`/tags${qs ? `?${qs}` : ''}`, { token });
    },
    create: (data: { name: string; type?: string }, token?: string) =>
      fetcher<ApiResponse<Tag>>('/tags', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: { name?: string; type?: string }, token?: string) =>
      fetcher<ApiResponse<Tag>>(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, token?: string) => fetcher<ApiResponse<void>>(`/tags/${id}`, { method: 'DELETE', token }),
  },
  inventory: {
    dashboard: (token?: string) => fetcher<ApiResponse<any>>('/inventory/dashboard', { token }),
    stock: {
      getByVariant: (variantId: string, token?: string) => fetcher<ApiResponse<any[]>>(`/inventory/stock?variantId=${variantId}`, { token }),
      getLevel: (variantId: string, warehouseId: string, token?: string) => fetcher<ApiResponse<any>>(`/inventory/stock?variantId=${variantId}&warehouseId=${warehouseId}`, { token }),
      adjust: (data: { variantId: string; warehouseId: string; quantity: number; reason: string; note?: string; reference?: string }, token?: string) =>
        fetcher<ApiResponse<any>>('/inventory/adjust', { method: 'POST', body: JSON.stringify(data), token }),
    },
    alerts: (token?: string) => fetcher<ApiResponse<any[]>>('/inventory/alerts', { token }),
    warehouses: {
      getAll: (token?: string) => fetcher<ApiResponse<any[]>>('/inventory/warehouses', { token }),
      getById: (id: string, token?: string) => fetcher<ApiResponse<any>>(`/inventory/warehouses/${id}`, { token }),
      create: (data: any, token?: string) => fetcher<ApiResponse<any>>('/inventory/warehouses', { method: 'POST', body: JSON.stringify(data), token }),
      update: (id: string, data: any, token?: string) => fetcher<ApiResponse<any>>(`/inventory/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
      delete: (id: string, token?: string) => fetcher<ApiResponse<void>>(`/inventory/warehouses/${id}`, { method: 'DELETE', token }),
    },
    movements: {
      getAll: (params?: { inventoryItemId?: string; reason?: string; search?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number; token?: string }) => {
        const qp = new URLSearchParams();
        if (params?.inventoryItemId) qp.set('inventoryItemId', params.inventoryItemId);
        if (params?.reason) qp.set('reason', params.reason);
        if (params?.search) qp.set('search', params.search);
        if (params?.dateFrom) qp.set('dateFrom', params.dateFrom);
        if (params?.dateTo) qp.set('dateTo', params.dateTo);
        if (params?.page) qp.set('page', String(params.page));
        if (params?.limit) qp.set('limit', String(params.limit));
        const qs = qp.toString();
        return fetcher<ApiResponse<any[]>>(`/inventory/movements${qs ? `?${qs}` : ''}`, { token: params?.token });
      },
    },
  },
  optionGroups: {
    getAll: (token?: string) => fetcher<ApiResponse<any[]>>('/products/option-groups', { token }),
    create: (data: { name: string; displayName: string }, token?: string) =>
      fetcher<ApiResponse<any>>('/products/option-groups', { method: 'POST', body: JSON.stringify(data), token }),
    addValue: (id: string, data: { value: string; label: string }, token?: string) =>
      fetcher<ApiResponse<any>>(`/products/option-groups/${id}/values`, { method: 'POST', body: JSON.stringify(data), token }),
  },
  upload: {
    single: async (file: File | Blob, preset: string): Promise<{ url: string; id: string }> => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${STORAGE_URL}/upload?preset=${preset}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
      }

      return res.json();
    },
    multiple: async (files: (File | Blob)[], preset: string): Promise<{ url: string; id: string }[]> => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const res = await fetch(`${STORAGE_URL}/upload/multiple?preset=${preset}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
      }

      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      await fetch(`${STORAGE_URL}/files/${id}`, { method: 'DELETE' });
    },
  },
};
