import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService } from '../../apps/server/src/modules/product/product.service.js';
import { prisma } from '@repo/db';

// Mock Prisma
vi.mock('@repo/db', () => ({
  prisma: {
    product: {
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

// Mock event bus
vi.mock('../../apps/server/src/common/events/event-bus.js', () => ({
  eventBus: {
    emit: vi.fn(),
  },
}));

describe('Product Status Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates product status to ACTIVE and sets isActive to true', async () => {
    const mockProduct = {
      id: 'prod_123',
      status: 'ACTIVE',
      isActive: true,
      name: 'Test Product',
    };

    vi.mocked(prisma.product.update).mockResolvedValue(mockProduct as any);

    const result = await productService.updateStatus('prod_123', 'ACTIVE');

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod_123' },
      data: {
        status: 'ACTIVE',
        isActive: true,
      },
      include: expect.any(Object),
    });
    expect(result.status).toBe('ACTIVE');
    expect(result.isActive).toBe(true);
  });

  it('updates product status to ARCHIVED and sets isActive to false', async () => {
    const mockProduct = {
      id: 'prod_123',
      status: 'ARCHIVED',
      isActive: false,
      name: 'Test Product',
    };

    vi.mocked(prisma.product.update).mockResolvedValue(mockProduct as any);

    const result = await productService.updateStatus('prod_123', 'ARCHIVED');

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod_123' },
      data: {
        status: 'ARCHIVED',
        isActive: false,
      },
      include: expect.any(Object),
    });
    expect(result.status).toBe('ARCHIVED');
    expect(result.isActive).toBe(false);
  });

  it('updates product status to DRAFT', async () => {
    const mockProduct = {
      id: 'prod_123',
      status: 'DRAFT',
      isActive: true,
      name: 'Test Product',
    };

    vi.mocked(prisma.product.update).mockResolvedValue(mockProduct as any);

    const result = await productService.updateStatus('prod_123', 'DRAFT');

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod_123' },
      data: {
        status: 'DRAFT',
        isActive: true,
      },
      include: expect.any(Object),
    });
    expect(result.status).toBe('DRAFT');
  });

  it('bulk status change updates multiple products', async () => {
    vi.mocked(prisma.product.updateMany).mockResolvedValue({ count: 3 } as any);

    const productIds = ['prod_1', 'prod_2', 'prod_3'];
    const result = await productService.bulkUpdateStatus(productIds, 'ACTIVE');

    expect(prisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: { in: productIds } },
      data: {
        status: 'ACTIVE',
        isActive: true,
      },
    });
    expect(result.count).toBe(3);
  });
});
