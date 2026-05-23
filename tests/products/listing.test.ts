import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService } from '../../apps/server/src/modules/product/product.service.js';
import { prisma } from '@repo/db';

// Mock Prisma
vi.mock('@repo/db', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Product Listing with Pagination and Sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated products with page and totalPages', async () => {
    const mockProducts = [{ id: 'prod_1' }, { id: 'prod_2' }];
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
    vi.mocked(prisma.product.count).mockResolvedValue(25);

    const result = await productService.getAll({ page: 2, limit: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(25);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (page - 1) * limit
        take: 10,
      })
    );
  });

  it('sorts products by price ascending', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await productService.getAll({ page: 1, limit: 10, sortBy: 'price', sortOrder: 'asc' });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { price: 'asc' },
      })
    );
  });

  it('sorts products by name', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await productService.getAll({ page: 1, limit: 10, sortBy: 'name', sortOrder: 'asc' });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
      })
    );
  });

  it('sorts products by createdAt descending (default)', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await productService.getAll({ page: 1, limit: 10 });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('filters by product status', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await productService.getAll({ page: 1, limit: 10, status: 'ACTIVE' });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
        }),
      })
    );
  });

  it('filters by product type', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await productService.getAll({ page: 1, limit: 10, productType: 'VARIABLE' });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productType: 'VARIABLE',
        }),
      })
    );
  });

  it('searches by product name', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await productService.getAll({ page: 1, limit: 10, search: 'shirt' });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: { contains: 'shirt', mode: 'insensitive' },
        }),
      })
    );
  });
});
