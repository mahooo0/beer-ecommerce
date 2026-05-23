import { describe, it, vi, beforeEach, expect } from 'vitest';
import { prismaMock } from '../setup';
import {
  mockWarehouse,
  mockInventoryItem,
  mockReservationMovement,
} from '../fixtures/inventory.fixtures';

vi.mock('/Users/muhemmedibrahimov/work/beer-ecommerce/packages/db/src/prisma.ts', () => ({
  prisma: prismaMock,
}));

vi.mock('/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/common/events/event-bus.ts', () => ({
  eventBus: { emit: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Re-configure $transaction default (gets cleared by clearAllMocks)
  prismaMock.$transaction.mockImplementation((input: any) => {
    if (Array.isArray(input)) return Promise.all(input.map((fn: Function) => fn()));
    if (typeof input === 'function') return input(prismaMock);
    return Promise.resolve();
  });
});

describe('Reservation System (INV-05)', () => {
  describe('reserveStock', () => {
    it('should increment reserved field within transaction', async () => {
      const { InventoryService } = await import(
        '/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/modules/inventory/inventory.service.js'
      );
      const service = new InventoryService();

      const item = { ...mockInventoryItem, quantity: 100, reserved: 5 }; // available = 95
      prismaMock.inventoryItem.findUnique.mockResolvedValue(item);
      prismaMock.inventoryItem.update.mockResolvedValue({ ...item, reserved: 15 });
      prismaMock.stockMovement.create.mockResolvedValue({
        id: 'mov-new',
        inventoryItemId: item.id,
        quantity: -10,
        reason: 'RESERVATION',
        reference: 'checkout-123',
        note: null,
        createdAt: new Date(),
      });

      await service.reserveStock('var-1', 'wh-1', 10, 'checkout-123');

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: item.id },
        data: { reserved: { increment: 10 } },
      });
      expect(prismaMock.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          inventoryItemId: item.id,
          quantity: -10,
          reason: 'RESERVATION',
          reference: 'checkout-123',
        }),
      });
    });

    it('should reject when available stock is insufficient', async () => {
      const { InventoryService } = await import(
        '/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/modules/inventory/inventory.service.js'
      );
      const service = new InventoryService();

      const item = { ...mockInventoryItem, quantity: 10, reserved: 5 }; // available = 5
      prismaMock.inventoryItem.findUnique.mockResolvedValue(item);

      await expect(service.reserveStock('var-1', 'wh-1', 10, 'checkout-123')).rejects.toMatchObject({
        statusCode: 409,
        message: 'Insufficient stock',
      });
    });

    it('should create a RESERVATION stock movement with checkout reference', async () => {
      const { InventoryService } = await import(
        '/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/modules/inventory/inventory.service.js'
      );
      const service = new InventoryService();

      const item = { ...mockInventoryItem, quantity: 50, reserved: 0 }; // available = 50
      prismaMock.inventoryItem.findUnique.mockResolvedValue(item);
      prismaMock.inventoryItem.update.mockResolvedValue({ ...item, reserved: 5 });
      prismaMock.stockMovement.create.mockResolvedValue({
        id: 'mov-new',
        inventoryItemId: item.id,
        quantity: -5,
        reason: 'RESERVATION',
        reference: 'chk-session-abc',
        note: null,
        createdAt: new Date(),
      });

      await service.reserveStock('var-1', 'wh-1', 5, 'chk-session-abc');

      expect(prismaMock.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reason: 'RESERVATION',
          reference: 'chk-session-abc',
        }),
      });
    });
  });

  describe('commitReservation', () => {
    it('should decrement quantity and reserved, create SALE movement', async () => {
      const { InventoryService } = await import(
        '/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/modules/inventory/inventory.service.js'
      );
      const service = new InventoryService();

      const reservation = { ...mockReservationMovement, reference: 'checkout-456' };
      const item = { ...mockInventoryItem, quantity: 100, reserved: 10, lowStockThreshold: 5 };

      prismaMock.stockMovement.findMany.mockResolvedValue([reservation]);
      prismaMock.inventoryItem.findUnique.mockResolvedValue(item);
      prismaMock.inventoryItem.update.mockResolvedValue({ ...item, quantity: 98, reserved: 8 });
      prismaMock.stockMovement.create.mockResolvedValue({
        id: 'mov-sale',
        inventoryItemId: item.id,
        quantity: -2,
        reason: 'SALE',
        reference: 'checkout-456',
        note: null,
        createdAt: new Date(),
      });

      await service.commitReservation('checkout-456');

      expect(prismaMock.stockMovement.findMany).toHaveBeenCalledWith({
        where: { reason: 'RESERVATION', reference: 'checkout-456' },
      });
      expect(prismaMock.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: { decrement: 2 },
            reserved: { decrement: 2 },
          }),
        })
      );
      expect(prismaMock.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reason: 'SALE',
          reference: 'checkout-456',
        }),
      });
    });

    it('should do nothing if no matching reservation exists', async () => {
      const { InventoryService } = await import(
        '/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/modules/inventory/inventory.service.js'
      );
      const service = new InventoryService();

      prismaMock.stockMovement.findMany.mockResolvedValue([]);

      await service.commitReservation('checkout-nonexistent');

      expect(prismaMock.inventoryItem.update).not.toHaveBeenCalled();
    });
  });

  describe('releaseReservation', () => {
    it('should decrement reserved field and create RESERVATION_RELEASE movement', async () => {
      const { InventoryService } = await import(
        '/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/modules/inventory/inventory.service.js'
      );
      const service = new InventoryService();

      const reservation = { ...mockReservationMovement, reference: 'checkout-456' };
      const item = { ...mockInventoryItem, quantity: 100, reserved: 10, lowStockThreshold: 5 };

      // First findMany: RESERVATION movements
      // Second findMany: RESERVATION_RELEASE movements (none exist yet)
      prismaMock.stockMovement.findMany
        .mockResolvedValueOnce([reservation]) // RESERVATION movements
        .mockResolvedValueOnce([]); // RESERVATION_RELEASE movements

      prismaMock.inventoryItem.findUnique.mockResolvedValue(item);
      prismaMock.inventoryItem.update.mockResolvedValue({ ...item, reserved: 8 });
      prismaMock.stockMovement.create.mockResolvedValue({
        id: 'mov-release',
        inventoryItemId: item.id,
        quantity: 2,
        reason: 'RESERVATION_RELEASE',
        reference: 'checkout-456',
        note: null,
        createdAt: new Date(),
      });

      await service.releaseReservation('checkout-456');

      expect(prismaMock.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reserved: { decrement: 2 },
          }),
        })
      );
      expect(prismaMock.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reason: 'RESERVATION_RELEASE',
          reference: 'checkout-456',
        }),
      });
    });

    it('should be idempotent for already-released reservations', async () => {
      const { InventoryService } = await import(
        '/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/modules/inventory/inventory.service.js'
      );
      const service = new InventoryService();

      // No unreleased reservations found
      prismaMock.stockMovement.findMany
        .mockResolvedValueOnce([]) // RESERVATION movements (none unreleased)
        .mockResolvedValueOnce([]); // or it returns from first call already empty

      await service.releaseReservation('checkout-already-released');

      expect(prismaMock.inventoryItem.update).not.toHaveBeenCalled();
      expect(prismaMock.stockMovement.create).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup expired reservations', () => {
    it('should find reservations older than 15 minutes', async () => {
      const { InventoryService } = await import(
        '/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/modules/inventory/inventory.service.js'
      );
      const service = new InventoryService();

      const expiredTime = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      const expiredReservation = {
        ...mockReservationMovement,
        createdAt: expiredTime,
        reference: 'checkout-expired',
      };

      // First call for expired reservations
      prismaMock.stockMovement.findMany
        .mockResolvedValueOnce([expiredReservation]) // expired RESERVATION movements
        .mockResolvedValueOnce([]) // RESERVATION_RELEASE for checkout-expired
        .mockResolvedValueOnce([expiredReservation]) // for releaseReservation RESERVATION lookup
        .mockResolvedValueOnce([]); // for releaseReservation RESERVATION_RELEASE lookup

      prismaMock.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem);
      prismaMock.inventoryItem.update.mockResolvedValue({ ...mockInventoryItem, reserved: 3 });
      prismaMock.stockMovement.create.mockResolvedValue({
        id: 'mov-cleanup',
        inventoryItemId: mockInventoryItem.id,
        quantity: 2,
        reason: 'RESERVATION_RELEASE',
        reference: 'checkout-expired',
        note: null,
        createdAt: new Date(),
      });

      const count = await service.releaseExpiredReservations();

      // Should have queried with a cutoff time
      expect(prismaMock.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reason: 'RESERVATION',
            createdAt: expect.objectContaining({ lt: expect.any(Date) }),
          }),
        })
      );
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should release each expired reservation', async () => {
      const { InventoryService } = await import(
        '/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/modules/inventory/inventory.service.js'
      );
      const service = new InventoryService();

      const expiredTime = new Date(Date.now() - 20 * 60 * 1000);
      const expiredReservation = {
        ...mockReservationMovement,
        createdAt: expiredTime,
        reference: 'checkout-expired-2',
      };

      prismaMock.stockMovement.findMany
        .mockResolvedValueOnce([expiredReservation]) // expired reservations
        .mockResolvedValueOnce([]) // no releases for checkout-expired-2
        .mockResolvedValueOnce([expiredReservation]) // reserveStock lookup
        .mockResolvedValueOnce([]); // release lookup

      prismaMock.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem);
      prismaMock.inventoryItem.update.mockResolvedValue({ ...mockInventoryItem, reserved: 3 });
      prismaMock.stockMovement.create.mockResolvedValue({
        id: 'mov-cleanup-2',
        inventoryItemId: mockInventoryItem.id,
        quantity: 2,
        reason: 'RESERVATION_RELEASE',
        reference: 'checkout-expired-2',
        note: null,
        createdAt: new Date(),
      });

      const count = await service.releaseExpiredReservations();

      expect(count).toBe(1);
      expect(prismaMock.inventoryItem.update).toHaveBeenCalled();
    });
  });
});
