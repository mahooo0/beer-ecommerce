import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Hoist mock creation so vi.fn() produces proper Vitest mock functions in Vitest 4.x
const prismaMock = vi.hoisted(() => {
  const product = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  };

  const mock = {
    product,
    productVariant: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    digitalMeta: { create: vi.fn(), upsert: vi.fn() },
    weightedMeta: { create: vi.fn(), upsert: vi.fn() },
    bundleItem: { createMany: vi.fn(), deleteMany: vi.fn() },
    productTag: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    productCollection: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    categoryAttribute: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    brand: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    collection: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    wishlist: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    wishlistItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    coupon: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    shippingZone: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    shippingMethod: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    warehouse: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    inventoryItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    stockMovement: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  };

  // Configure $transaction to support both array and callback styles
  mock.$transaction.mockImplementation((input: any) => {
    if (Array.isArray(input)) return Promise.all(input.map((fn: Function) => fn()));
    if (typeof input === 'function') return input(mock);
    return Promise.resolve();
  });

  // Default return value for product.create
  mock.product.create.mockResolvedValue({});

  return mock;
});

// Note: @repo/db is mocked individually in each test file using vi.mock('@repo/db', ...)
// The prismaMock object is exported for use in test files that mock @repo/db

// Export shared mock product fixtures
export const mockSimpleProduct = {
  id: 'prod-1',
  name: 'Test Product',
  slug: 'test-product',
  description: 'A test product description here',
  price: 1999,
  sku: 'TEST-001',
  productType: 'SIMPLE',
  status: 'DRAFT',
  images: [],
  isActive: true,
  categoryId: 'cat-1',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockVariableProduct = {
  id: 'prod-2',
  name: 'Variable T-Shirt',
  slug: 'variable-t-shirt',
  description: 'T-shirt with size and color variants',
  price: 2499,
  sku: 'VAR-001',
  productType: 'VARIABLE',
  status: 'ACTIVE',
  images: [],
  isActive: true,
  categoryId: 'cat-1',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  variants: [
    {
      id: 'var-1',
      productId: 'prod-2',
      sku: 'VAR-001-S-RED',
      price: 2499,
      stock: 10,
      options: { size: 'S', color: 'Red' },
    },
    {
      id: 'var-2',
      productId: 'prod-2',
      sku: 'VAR-001-M-BLUE',
      price: 2499,
      stock: 15,
      options: { size: 'M', color: 'Blue' },
    },
  ],
};

export const mockWeightedProduct = {
  id: 'prod-3',
  name: 'Organic Apples',
  slug: 'organic-apples',
  description: 'Fresh organic apples sold by weight',
  price: 399,
  sku: 'WEIGHT-001',
  productType: 'WEIGHTED',
  status: 'ACTIVE',
  images: [],
  isActive: true,
  categoryId: 'cat-2',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  weightedMeta: {
    id: 'wm-1',
    productId: 'prod-3',
    weightUnit: 'KG',
    pricePerUnit: 399,
    minWeight: 100,
    maxWeight: 5000,
    stepWeight: 100,
  },
};

export const mockDigitalProduct = {
  id: 'prod-4',
  name: 'E-Book: Learn TypeScript',
  slug: 'learn-typescript-ebook',
  description: 'Comprehensive TypeScript guide',
  price: 1999,
  sku: 'DIGITAL-001',
  productType: 'DIGITAL',
  status: 'ACTIVE',
  images: [],
  isActive: true,
  categoryId: 'cat-3',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  digitalMeta: {
    id: 'dm-1',
    productId: 'prod-4',
    fileUrl: 'https://cdn.example.com/typescript-guide.pdf',
    fileName: 'typescript-guide.pdf',
    maxDownloads: 5,
    accessDuration: 30,
  },
};

export const mockBundleProduct = {
  id: 'prod-5',
  name: 'Starter Bundle',
  slug: 'starter-bundle',
  description: 'Complete starter kit with 3 products',
  price: 4999,
  sku: 'BUNDLE-001',
  productType: 'BUNDLE',
  status: 'ACTIVE',
  images: [],
  isActive: true,
  categoryId: 'cat-1',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  bundleItems: [
    {
      id: 'bi-1',
      bundleId: 'prod-5',
      productId: 'prod-1',
      quantity: 2,
      discount: 10,
    },
    {
      id: 'bi-2',
      bundleId: 'prod-5',
      productId: 'prod-4',
      quantity: 1,
      discount: 5,
    },
  ],
};

// Category domain mock fixtures
export const mockCategory = {
  id: 'cat-1',
  name: 'Electronics',
  slug: 'electronics',
  path: '/electronics',
  depth: 0,
  position: 0,
  parentId: null,
  description: null,
  isActive: true,
  metaTitle: null,
  metaDescription: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockChildCategory = {
  id: 'cat-1-1',
  name: 'Phones',
  slug: 'phones',
  path: '/electronics/phones',
  depth: 1,
  position: 0,
  parentId: 'cat-1',
  description: null,
  isActive: true,
  metaTitle: null,
  metaDescription: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockGrandchildCategory = {
  id: 'cat-1-1-1',
  name: 'Smartphones',
  slug: 'smartphones',
  path: '/electronics/phones/smartphones',
  depth: 2,
  position: 0,
  parentId: 'cat-1-1',
  description: null,
  isActive: true,
  metaTitle: null,
  metaDescription: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockBrand = {
  id: 'brand-1',
  name: 'Samsung',
  slug: 'samsung',
  logo: null,
  description: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockTag = {
  id: 'tag-1',
  name: 'New Arrival',
  slug: 'new-arrival',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockCollection = {
  id: 'col-1',
  name: 'Summer Sale',
  slug: 'summer-sale',
  description: null,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockCategoryAttribute = {
  id: 'attr-1',
  categoryId: 'cat-1',
  name: 'Screen Size',
  key: 'screen_size',
  type: 'SELECT',
  values: ['32 inch', '55 inch', '65 inch'],
  unit: 'inch',
  isFilterable: true,
  isRequired: false,
  position: 0,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

// Export prisma mock for use in tests
export { prismaMock };

// Mock meilisearch SDK
const meiliMocks = vi.hoisted(() => {
  const mockIndex = {
    search: vi.fn(),
    addDocuments: vi.fn(),
    updateDocuments: vi.fn(),
    deleteDocument: vi.fn(),
    deleteAllDocuments: vi.fn(),
    updateSettings: vi.fn(),
    getSettings: vi.fn(),
    updateSynonyms: vi.fn(),
    getSynonyms: vi.fn(),
    updateStopWords: vi.fn(),
    getStopWords: vi.fn(),
    updateRankingRules: vi.fn(),
    getRankingRules: vi.fn(),
    waitForTask: vi.fn(),
  };
  const mockClient = {
    index: vi.fn(),
    createKey: vi.fn(),
    getKeys: vi.fn(),
    waitForTask: vi.fn(),
  };
  return { mockIndex, mockClient };
});

// Configure meili mock default values
meiliMocks.mockIndex.search.mockResolvedValue({ hits: [], estimatedTotalHits: 0, facetDistribution: {} });
meiliMocks.mockIndex.addDocuments.mockResolvedValue({ taskUid: 1 });
meiliMocks.mockIndex.updateDocuments.mockResolvedValue({ taskUid: 2 });
meiliMocks.mockIndex.deleteDocument.mockResolvedValue({ taskUid: 3 });
meiliMocks.mockIndex.deleteAllDocuments.mockResolvedValue({ taskUid: 4 });
meiliMocks.mockIndex.updateSettings.mockResolvedValue({ taskUid: 5 });
meiliMocks.mockIndex.getSettings.mockResolvedValue({});
meiliMocks.mockIndex.updateSynonyms.mockResolvedValue({ taskUid: 6 });
meiliMocks.mockIndex.getSynonyms.mockResolvedValue({});
meiliMocks.mockIndex.updateStopWords.mockResolvedValue({ taskUid: 7 });
meiliMocks.mockIndex.getStopWords.mockResolvedValue([]);
meiliMocks.mockIndex.updateRankingRules.mockResolvedValue({ taskUid: 8 });
meiliMocks.mockIndex.getRankingRules.mockResolvedValue([]);
meiliMocks.mockIndex.waitForTask.mockResolvedValue({ status: 'succeeded' });
meiliMocks.mockClient.index.mockReturnValue(meiliMocks.mockIndex);
meiliMocks.mockClient.createKey.mockResolvedValue({ key: 'test-search-key' });
meiliMocks.mockClient.getKeys.mockResolvedValue({ results: [] });
meiliMocks.mockClient.waitForTask.mockResolvedValue({ status: 'succeeded' });

vi.mock('meilisearch', () => ({
  MeiliSearch: vi.fn().mockImplementation(() => meiliMocks.mockClient),
}));
