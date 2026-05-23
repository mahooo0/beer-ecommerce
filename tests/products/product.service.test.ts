import { describe, it, expect, vi, beforeEach } from 'vitest';

// In Vitest 4.x, module aliases in vi.mock() aren't resolved through vitest.config.ts aliases.
// Must use the resolved path that the alias points to.
const DB_MODULE = '/Users/muhemmedibrahimov/work/beer-ecommerce/packages/db/src/index.ts';

// Create hoisted mocks so vi.fn() produces proper Vitest mock functions
const productMocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  count: vi.fn(),
  groupBy: vi.fn(),
  create: vi.fn(),
}));

const brandMocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

// Mock @repo/db using the absolute resolved path
vi.mock('/Users/muhemmedibrahimov/work/beer-ecommerce/packages/db/src/index.ts', () => ({
  prisma: {
    product: productMocks,
    brand: brandMocks,
    productVariant: { deleteMany: vi.fn() },
    productTag: { deleteMany: vi.fn() },
    productCollection: { deleteMany: vi.fn() },
    bundleItem: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

// Mock event-bus to prevent side effects
vi.mock('/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/common/events/event-bus.ts', () => ({
  eventBus: { emit: vi.fn() },
}));

vi.mock('/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/common/events/event-bus.js', () => ({
  eventBus: { emit: vi.fn() },
}));

// Mock slug utils
vi.mock('/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/utils/slug.utils.ts', () => ({
  generateUniqueSlug: vi.fn().mockResolvedValue('test-slug'),
}));

vi.mock('/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/utils/slug.utils.js', () => ({
  generateUniqueSlug: vi.fn().mockResolvedValue('test-slug'),
}));

import { productService } from '../../apps/server/src/modules/product/product.service.js';

describe('ProductService - Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // FILT-01: Category attribute JSONB filtering
  it('returns products filtered by category attribute (JSONB path query)', async () => {
    const mockProducts = [{ id: 'prod-1', name: 'Red Phone', attributes: { color: 'red' } }];
    productMocks.findMany.mockResolvedValue(mockProducts);
    productMocks.count.mockResolvedValue(1);

    const result = await productService.filterProducts({
      attributes: 'color:red',
      categoryPath: '/electronics',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.products).toEqual(mockProducts);
    expect(result.total).toBe(1);

    const callArgs = productMocks.findMany.mock.calls[0][0] as any;
    expect(callArgs.where.AND).toBeDefined();
    expect(callArgs.where.AND[0].OR[0]).toMatchObject({
      attributes: { path: ['color'], equals: 'red' },
    });
  });

  // FILT-05: OR logic within attribute group
  it('applies OR logic within same attribute group (red OR blue)', async () => {
    productMocks.findMany.mockResolvedValue([]);
    productMocks.count.mockResolvedValue(0);

    await productService.filterProducts({
      attributes: 'color:red,color:blue',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const callArgs = productMocks.findMany.mock.calls[0][0] as any;
    const colorGroup = callArgs.where.AND.find((g: any) =>
      g.OR?.some((c: any) => c.attributes?.path?.[0] === 'color')
    );
    expect(colorGroup).toBeDefined();
    expect(colorGroup.OR).toHaveLength(2);
    expect(colorGroup.OR[0]).toMatchObject({ attributes: { path: ['color'], equals: 'red' } });
    expect(colorGroup.OR[1]).toMatchObject({ attributes: { path: ['color'], equals: 'blue' } });
  });

  it('applies AND logic across different attribute groups (color AND size)', async () => {
    productMocks.findMany.mockResolvedValue([]);
    productMocks.count.mockResolvedValue(0);

    await productService.filterProducts({
      attributes: 'color:red,size:large',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const callArgs = productMocks.findMany.mock.calls[0][0] as any;
    expect(callArgs.where.AND).toHaveLength(2);
  });

  // FILT-07: Availability filter
  it('filters in-stock products by variant stock > 0', async () => {
    productMocks.findMany.mockResolvedValue([]);
    productMocks.count.mockResolvedValue(0);

    await productService.filterProducts({
      availability: 'in_stock',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const callArgs = productMocks.findMany.mock.calls[0][0] as any;
    expect(callArgs.where.OR).toContainEqual({ variants: { some: { stock: { gt: 0 } } } });
  });

  it('filters out-of-stock products where all variants stock = 0', async () => {
    productMocks.findMany.mockResolvedValue([]);
    productMocks.count.mockResolvedValue(0);

    await productService.filterProducts({
      availability: 'out_of_stock',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const callArgs = productMocks.findMany.mock.calls[0][0] as any;
    expect(callArgs.where.OR).toContainEqual({ variants: { every: { stock: { equals: 0 } } } });
  });

  it('handles variable products with mixed variant stock', async () => {
    productMocks.findMany.mockResolvedValue([]);
    productMocks.count.mockResolvedValue(0);

    await productService.filterProducts({
      availability: 'in_stock,out_of_stock',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const callArgs = productMocks.findMany.mock.calls[0][0] as any;
    expect(callArgs.where.OR).toHaveLength(2);
  });

  it('filters products by price range', async () => {
    productMocks.findMany.mockResolvedValue([]);
    productMocks.count.mockResolvedValue(0);

    await productService.filterProducts({
      minPrice: 1000,
      maxPrice: 5000,
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const callArgs = productMocks.findMany.mock.calls[0][0] as any;
    expect(callArgs.where.price).toMatchObject({ gte: 1000, lte: 5000 });
  });

  it('filters products by brand IDs (OR logic)', async () => {
    productMocks.findMany.mockResolvedValue([]);
    productMocks.count.mockResolvedValue(0);

    await productService.filterProducts({
      brands: 'brand-1,brand-2',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const callArgs = productMocks.findMany.mock.calls[0][0] as any;
    expect(callArgs.where.brandId).toMatchObject({ in: ['brand-1', 'brand-2'] });
  });

  it('always filters by ACTIVE status', async () => {
    productMocks.findMany.mockResolvedValue([]);
    productMocks.count.mockResolvedValue(0);

    await productService.filterProducts({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const callArgs = productMocks.findMany.mock.calls[0][0] as any;
    expect(callArgs.where.status).toBe('ACTIVE');
  });

  it('returns paginated results with totalPages', async () => {
    productMocks.findMany.mockResolvedValue([{ id: 'p1' }]);
    productMocks.count.mockResolvedValue(45);

    const result = await productService.filterProducts({
      page: 2,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.total).toBe(45);
    expect(result.totalPages).toBe(5);
    expect(result.products).toHaveLength(1);

    const callArgs = productMocks.findMany.mock.calls[0][0] as any;
    expect(callArgs.skip).toBe(10);
    expect(callArgs.take).toBe(10);
  });

  // FILT-03: Facet counts
  it('calculates facet counts for brand filter values', async () => {
    const mockBrandGroups = [
      { brandId: 'brand-1', _count: { id: 5 } },
      { brandId: 'brand-2', _count: { id: 3 } },
    ];
    const mockBrands = [
      { id: 'brand-1', name: 'Samsung' },
      { id: 'brand-2', name: 'Apple' },
    ];
    productMocks.groupBy.mockResolvedValue(mockBrandGroups);
    brandMocks.findMany.mockResolvedValue(mockBrands);
    productMocks.findMany.mockResolvedValue([]);
    productMocks.count.mockResolvedValue(0);

    const result = await productService.getFacetCounts('/electronics', {});

    expect(result.brands).toHaveLength(2);
    expect(result.brands[0]).toMatchObject({ id: 'brand-1', name: 'Samsung', count: 5 });
    expect(result.brands[1]).toMatchObject({ id: 'brand-2', name: 'Apple', count: 3 });
  });

  it('calculates facet counts for dynamic attribute values', async () => {
    const mockProducts = [
      { attributes: { color: 'red', size: 'large' } },
      { attributes: { color: 'blue', size: 'large' } },
      { attributes: { color: 'red', size: 'small' } },
    ];
    productMocks.groupBy.mockResolvedValue([]);
    brandMocks.findMany.mockResolvedValue([]);
    productMocks.findMany.mockResolvedValue(mockProducts);
    productMocks.count
      .mockResolvedValueOnce(2) // in_stock count
      .mockResolvedValueOnce(1); // out_of_stock count

    const result = await productService.getFacetCounts('/electronics', {});

    expect(result.attributes).toBeDefined();
    expect(result.attributes['color']).toBeDefined();
    const colorRed = result.attributes['color'].find((v: any) => v.value === 'red');
    const colorBlue = result.attributes['color'].find((v: any) => v.value === 'blue');
    expect(colorRed?.count).toBe(2);
    expect(colorBlue?.count).toBe(1);
  });
});
