import type {
  ApiResponse,
  PaginatedResponse,
  Product,
  Order,
  User,
  ShippingZone,
  ShippingMethod,
  Category,
  CategoryAttribute,
  Brand,
  PromoBanner,
  LoyaltyTier,
  Tag,
  Collection,
  Attribute,
  AttributeValue,
  ProductAttributeValue,
  CategoryFilter,
  CategoryFilterOption,
} from '@repo/types';

// ============================================================================
// Structured-attribute / category-filter / product-facet payload shapes.
// These mirror the server responses in apps/server/src/modules/{attribute,
// category,product}. All ids are cuid strings.
// ============================================================================

/** A single attribute-value selection sent to PUT /attributes/product/:id. */
export interface ProductAttributeValueInput {
  attributeId: string;
  attributeValueId: string;
}

/** Query params accepted by GET /products/filter (and /facets, /completeness-stats). */
export interface ProductFilterParams {
  minPrice?: number;
  maxPrice?: number;
  brands?: string; // comma-separated brand ids
  attributes?: string; // legacy JSONB "key:value" pairs
  attributeValues?: string; // comma-separated AttributeValue ids
  availability?: string; // comma-separated: in_stock | out_of_stock | pre_order
  isAvailable?: boolean; // manual in/out-of-stock flag
  categoryId?: string;
  categoryPath?: string;
  completenessFilter?: 'complete' | 'incomplete';
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  token?: string;
}

/** GET /products/facets response payload (data field of ApiResponse). */
export interface ProductFacets {
  brands: Array<{ id: string; name: string; count: number }>;
  attributes: Record<string, Array<{ value: string; count: number }>>;
  attributeValues: Array<{ attributeValueId: string; count: number }>;
  availability: Array<{ status: string; count: number }>;
  isAvailable: Array<{ value: boolean; count: number }>;
  priceRange: { min: number; max: number } | null;
}

/** GET /products/completeness-stats response payload. */
export interface ProductCompletenessStats {
  total: number;
  complete: number;
  high: number;
  medium: number;
  low: number;
  empty: number;
  incomplete: number;
  fields: number; // number of scored fields (COMPLETENESS_FIELDS = 6)
}

/** Payload CMS list envelope (blog/content), returned verbatim by /api/blog/:collection. */
export interface PayloadList<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

/** Payload create/update envelope. */
export interface PayloadMutation<T> {
  doc: T;
  message?: string;
}

/** Query params accepted by the blog proxy (Payload query language, passed through). */
export type BlogQuery = Record<string, string | number | boolean | undefined>;

function blogQs(query?: BlogQuery): string {
  if (!query) return '';
  const qp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) qp.set(k, String(v));
  }
  const s = qp.toString();
  return s ? `?${s}` : '';
}

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
    getBySlug: (slug: string, token?: string) =>
      fetcher<ApiResponse<Product>>(`/products/slug/${slug}`, { token }),
    // Rich catalog filter — GET /products/filter. Returns a PaginatedResponse
    // shaped envelope { success, data, total, page, limit, totalPages }.
    filter: (params?: ProductFilterParams) => {
      const qp = new URLSearchParams();
      if (params?.minPrice != null) qp.set('minPrice', String(params.minPrice));
      if (params?.maxPrice != null) qp.set('maxPrice', String(params.maxPrice));
      if (params?.brands) qp.set('brands', params.brands);
      if (params?.attributes) qp.set('attributes', params.attributes);
      if (params?.attributeValues) qp.set('attributeValues', params.attributeValues);
      if (params?.availability) qp.set('availability', params.availability);
      if (params?.isAvailable != null) qp.set('isAvailable', String(params.isAvailable));
      if (params?.categoryId) qp.set('categoryId', params.categoryId);
      if (params?.categoryPath) qp.set('categoryPath', params.categoryPath);
      if (params?.completenessFilter) qp.set('completenessFilter', params.completenessFilter);
      if (params?.status) qp.set('status', params.status);
      if (params?.page) qp.set('page', String(params.page));
      if (params?.limit) qp.set('limit', String(params.limit));
      if (params?.sortBy) qp.set('sortBy', params.sortBy);
      if (params?.sortOrder) qp.set('sortOrder', params.sortOrder);
      const qs = qp.toString();
      return fetcher<PaginatedResponse<Product>>(`/products/filter${qs ? `?${qs}` : ''}`, { token: params?.token });
    },
    // GET /products/facets — facet counts for the current filter set.
    facets: (params?: ProductFilterParams) => {
      const qp = new URLSearchParams();
      if (params?.categoryPath) qp.set('categoryPath', params.categoryPath);
      if (params?.categoryId) qp.set('categoryId', params.categoryId);
      if (params?.minPrice != null) qp.set('minPrice', String(params.minPrice));
      if (params?.maxPrice != null) qp.set('maxPrice', String(params.maxPrice));
      if (params?.brands) qp.set('brands', params.brands);
      if (params?.attributes) qp.set('attributes', params.attributes);
      if (params?.attributeValues) qp.set('attributeValues', params.attributeValues);
      if (params?.availability) qp.set('availability', params.availability);
      if (params?.isAvailable != null) qp.set('isAvailable', String(params.isAvailable));
      const qs = qp.toString();
      return fetcher<ApiResponse<ProductFacets>>(`/products/facets${qs ? `?${qs}` : ''}`, { token: params?.token });
    },
    // GET /products/completeness-stats — accepts the same filter params as list.
    completenessStats: (params?: ProductFilterParams) => {
      const qp = new URLSearchParams();
      if (params?.categoryId) qp.set('categoryId', params.categoryId);
      if (params?.categoryPath) qp.set('categoryPath', params.categoryPath);
      if (params?.status) qp.set('status', params.status);
      if (params?.brands) qp.set('brands', params.brands);
      if (params?.attributeValues) qp.set('attributeValues', params.attributeValues);
      if (params?.isAvailable != null) qp.set('isAvailable', String(params.isAvailable));
      const qs = qp.toString();
      return fetcher<ApiResponse<ProductCompletenessStats>>(`/products/completeness-stats${qs ? `?${qs}` : ''}`, { token: params?.token });
    },
    // PUT /attributes/product/:productId — bulk-set a product's attribute values
    // (delete-all-then-createMany server-side). Convenience alias that lives on
    // api.products for the product form; the same call exists on api.attributes.
    setAttributeValues: (productId: string, values: ProductAttributeValueInput[], token?: string) =>
      fetcher<ApiResponse<ProductAttributeValue[]>>(`/attributes/product/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ values }),
        token,
      }),
  },
  // ==========================================================================
  // Structured attributes (normalized, 4fr-style) — mounted at /attributes.
  // See apps/server/src/modules/attribute/attribute.routes.ts.
  // ==========================================================================
  attributes: {
    // GET /attributes/category/:categoryId — attributes (with their values).
    byCategory: (categoryId: string, token?: string) =>
      fetcher<ApiResponse<Attribute[]>>(`/attributes/category/${categoryId}`, { token }),
    // GET /attributes/:id — single attribute with values.
    get: (id: string, token?: string) =>
      fetcher<ApiResponse<Attribute>>(`/attributes/${id}`, { token }),
    // POST /attributes — `name` (machine slug) optional; derived server-side.
    create: (
      data: {
        categoryId: string;
        displayName: string;
        name?: string;
        isFilterable?: boolean;
        isVisibleOnProductPage?: boolean;
        usedForVariations?: boolean;
        showValueIcons?: boolean;
        displayType?: 'checkbox' | 'select' | 'button' | 'color' | 'range';
        sortOrder?: number;
        isActive?: boolean;
      },
      token?: string
    ) =>
      fetcher<ApiResponse<Attribute>>('/attributes', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    // PUT /attributes/:id
    update: (id: string, data: Partial<Attribute>, token?: string) =>
      fetcher<ApiResponse<Attribute>>(`/attributes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    // DELETE /attributes/:id
    remove: (id: string, token?: string) =>
      fetcher<ApiResponse<void>>(`/attributes/${id}`, { method: 'DELETE', token }),
    // PUT /attributes/reorder — bulk drag-and-drop; body is a raw array.
    reorder: (order: Array<{ id: string; sortOrder: number }>, token?: string) =>
      fetcher<ApiResponse<void>>('/attributes/reorder', {
        method: 'PUT',
        body: JSON.stringify(order),
        token,
      }),
    // ----- Attribute values (the "common option / общая опция") -----
    // POST /attributes/values — 409 on duplicate value within an attribute.
    createValue: (
      data: {
        attributeId: string;
        value: string;
        displayValue?: string;
        colorCode?: string;
        iconUrl?: string;
        sortOrder?: number;
        isActive?: boolean;
      },
      token?: string
    ) =>
      fetcher<ApiResponse<AttributeValue>>('/attributes/values', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    // PUT /attributes/values/:id
    updateValue: (id: string, data: Partial<AttributeValue>, token?: string) =>
      fetcher<ApiResponse<AttributeValue>>(`/attributes/values/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    // DELETE /attributes/values/:id
    removeValue: (id: string, token?: string) =>
      fetcher<ApiResponse<void>>(`/attributes/values/${id}`, { method: 'DELETE', token }),
    // PUT /attributes/values/reorder — bulk drag-and-drop; body is a raw array.
    valuesReorder: (order: Array<{ id: string; sortOrder: number }>, token?: string) =>
      fetcher<ApiResponse<void>>('/attributes/values/reorder', {
        method: 'PUT',
        body: JSON.stringify(order),
        token,
      }),
    // ----- Product attribute values (junction) -----
    // GET /attributes/product/:productId
    getProductValues: (productId: string, token?: string) =>
      fetcher<ApiResponse<ProductAttributeValue[]>>(`/attributes/product/${productId}`, { token }),
    // PUT /attributes/product/:productId — bulk-set (delete-all-then-createMany).
    setProductValues: (productId: string, values: ProductAttributeValueInput[], token?: string) =>
      fetcher<ApiResponse<ProductAttributeValue[]>>(`/attributes/product/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ values }),
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
    // Manual category filters ("добавить фильтр для категории"). These are
    // mounted UNDER the category router: reads at /categories/:id/filters,
    // writes at /categories/filters/... (see category.routes.ts).
    filters: {
      byCategory: (categoryId: string, token?: string) =>
        fetcher<ApiResponse<CategoryFilter[]>>(`/categories/${categoryId}/filters`, { token }),
      create: (categoryId: string, data: Partial<CategoryFilter>, token?: string) =>
        fetcher<ApiResponse<CategoryFilter>>(`/categories/${categoryId}/filters`, {
          method: 'POST',
          body: JSON.stringify(data),
          token,
        }),
      update: (filterId: string, data: Partial<CategoryFilter>, token?: string) =>
        fetcher<ApiResponse<CategoryFilter>>(`/categories/filters/${filterId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
          token,
        }),
      remove: (filterId: string, token?: string) =>
        fetcher<ApiResponse<void>>(`/categories/filters/${filterId}`, { method: 'DELETE', token }),
      createOption: (data: { filterId: string; value: string; label?: string; sortOrder?: number; isActive?: boolean }, token?: string) =>
        fetcher<ApiResponse<CategoryFilterOption>>('/categories/filters/options', {
          method: 'POST',
          body: JSON.stringify(data),
          token,
        }),
      removeOption: (optionId: string, token?: string) =>
        fetcher<ApiResponse<void>>(`/categories/filters/options/${optionId}`, { method: 'DELETE', token }),
      // POST /categories/filters/:id/auto-populate — manufacturer-source only.
      autoPopulate: (filterId: string, token?: string) =>
        fetcher<ApiResponse<{ count: number }>>(`/categories/filters/${filterId}/auto-populate`, {
          method: 'POST',
          token,
        }),
    },
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
  promoBanners: {
    getAll: (params?: { token?: string }) =>
      fetcher<ApiResponse<PromoBanner[]>>('/promo-banners', { token: params?.token }),
    getById: (id: string, token?: string) =>
      fetcher<ApiResponse<PromoBanner>>(`/promo-banners/${id}`, { token }),
    create: (data: Record<string, unknown>, token?: string) =>
      fetcher<ApiResponse<PromoBanner>>('/promo-banners', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: Record<string, unknown>, token?: string) =>
      fetcher<ApiResponse<PromoBanner>>(`/promo-banners/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, token?: string) =>
      fetcher<ApiResponse<void>>(`/promo-banners/${id}`, { method: 'DELETE', token }),
  },
  loyaltyTiers: {
    getAll: (params?: { token?: string }) =>
      fetcher<ApiResponse<LoyaltyTier[]>>('/loyalty-tiers', { token: params?.token }),
    getById: (id: string, token?: string) =>
      fetcher<ApiResponse<LoyaltyTier>>(`/loyalty-tiers/${id}`, { token }),
    create: (data: Record<string, unknown>, token?: string) =>
      fetcher<ApiResponse<LoyaltyTier>>('/loyalty-tiers', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: Record<string, unknown>, token?: string) =>
      fetcher<ApiResponse<LoyaltyTier>>(`/loyalty-tiers/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, token?: string) =>
      fetcher<ApiResponse<void>>(`/loyalty-tiers/${id}`, { method: 'DELETE', token }),
  },
  // ==========================================================================
  // Blog / content (Payload CMS) via the server proxy at /api/blog/:collection.
  // Responses are Payload's native shape. All calls are admin-only (Clerk token).
  // Collections: posts | categories | media | forms | form-submissions.
  // ==========================================================================
  blog: {
    list: <T = Record<string, unknown>>(collection: string, query?: BlogQuery, token?: string) =>
      fetcher<PayloadList<T>>(`/blog/${collection}${blogQs(query)}`, { token }),
    get: <T = Record<string, unknown>>(collection: string, id: string | number, query?: BlogQuery, token?: string) =>
      fetcher<T>(`/blog/${collection}/${id}${blogQs(query)}`, { token }),
    create: <T = Record<string, unknown>>(collection: string, data: unknown, query?: BlogQuery, token?: string) =>
      fetcher<PayloadMutation<T>>(`/blog/${collection}${blogQs(query)}`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: <T = Record<string, unknown>>(collection: string, id: string | number, data: unknown, query?: BlogQuery, token?: string) =>
      fetcher<PayloadMutation<T>>(`/blog/${collection}/${id}${blogQs(query)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
    remove: (collection: string, id: string | number, query?: BlogQuery, token?: string) =>
      fetcher<{ message?: string }>(`/blog/${collection}/${id}${blogQs(query)}`, {
        method: 'DELETE',
        token,
      }),
    // Multipart upload → Payload media (via the server proxy). Do NOT set
    // Content-Type — the browser adds the multipart boundary.
    uploadMedia: async (
      file: File,
      alt: string | undefined,
      token: string,
    ): Promise<PayloadMutation<{ id: number | string; url?: string; thumbnailURL?: string | null; alt?: string | null; filename?: string }>> => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('_payload', JSON.stringify({ alt: alt || undefined }));
      const res = await fetch(`${API_URL}/blog/media/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error((e as { error?: string }).error || 'Upload failed');
      }
      return res.json();
    },
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
