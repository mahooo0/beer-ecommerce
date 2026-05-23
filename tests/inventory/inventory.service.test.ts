import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../setup';
import {
  mockWarehouse,
  mockWarehouse2,
  mockInventoryItem,
  mockInventoryItemLowStock,
  mockStockMovement,
} from '../fixtures/inventory.fixtures';

vi.mock('/Users/muhemmedibrahimov/work/beer-ecommerce/packages/db/src/prisma.ts', () => ({
  prisma: prismaMock,
}));

const eventBusMocks = vi.hoisted(() => ({
  emitMock: vi.fn(),
}));

vi.mock(
  '/Users/muhemmedibrahimov/work/beer-ecommerce/apps/server/src/common/events/event-bus.ts',
  () => ({
    eventBus: { emit: eventBusMocks.emitMock },
  })
);

import { inventoryService } from '../../apps/server/src/modules/inventory/inventory.service';

// Extended fixture data with warehouse relation
const mockInventoryItemWithWarehouse = {
  ...mockInventoryItem,
  warehouse: mockWarehouse,
};

// West coast item
const mockInventoryItemWest = {
  id: 'inv-3',
  variantId: 'var-1',
  warehouseId: 'wh-2',
  quantity: 50,
  reserved: 5,
  lowStockThreshold: 10,
  warehouse: mockWarehouse2,
};

beforeEach(() => {
  vi.clearAllMocks();
  eventBusMocks.emitMock.mockReset();
});

describe('InventoryService', () => {
  // INV-01: Stock Tracking — available = quantity - reserved
  describe('Stock Tracking (INV-01)', () => {
    it('should get stock level for a variant across all warehouses', async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([
        mockInventoryItemWithWarehouse,
        mockInventoryItemWest,
      ]);

      const result = await inventoryService.getStockByVariant('var-1');

      expect(result).toHaveLength(2);
      expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { variantId: 'var-1' } })
      );
    });

    it('should return available quantity as quantity minus reserved', async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([mockInventoryItemWithWarehouse]);

      const result = await inventoryService.getStockByVariant('var-1');

      // mockInventoryItem: quantity=100, reserved=5 → available=95
      expect(result[0]).toMatchObject({
        quantity: 100,
        reserved: 5,
        available: 95,
      });
    });

    it('should get stock for a specific variant-warehouse combination', async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue(mockInventoryItemWithWarehouse);

      const result = await inventoryService.getStockLevel('var-1', 'wh-1');

      expect(result).toMatchObject({
        quantity: 100,
        reserved: 5,
        available: 95,
        warehouseId: 'wh-1',
      });
    });

    it('throws 404 when inventory item not found', async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue(null);

      await expect(inventoryService.getStockLevel('var-x', 'wh-x')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  // INV-02: Low Stock Alerts
  describe('Low Stock Alerts (INV-02)', () => {
    it('should return items where available stock is at or below threshold', async () => {
      const alertItem = {
        id: mockInventoryItemLowStock.id,
        variantId: mockInventoryItemLowStock.variantId,
        warehouseId: mockInventoryItemLowStock.warehouseId,
        quantity: mockInventoryItemLowStock.quantity,
        reserved: mockInventoryItemLowStock.reserved,
        lowStockThreshold: mockInventoryItemLowStock.lowStockThreshold,
        available: 3,
        sku: 'VAR-001',
        productName: 'Test Product',
        warehouseName: 'Main Warehouse',
      };
      prismaMock.$queryRaw.mockResolvedValue([alertItem]);

      const result = await inventoryService.getLowStockAlerts();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        available: 3,
        lowStockThreshold: 10,
      });
    });

    it('should not flag items with available stock above threshold', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      const result = await inventoryService.getLowStockAlerts();

      expect(result).toEqual([]);
    });
  });

  // INV-03: Warehouse CRUD
  describe('Warehouse CRUD (INV-03)', () => {
    it('should create a warehouse with all fields', async () => {
      prismaMock.warehouse.create.mockResolvedValue(mockWarehouse);

      const result = await inventoryService.createWarehouse({
        name: mockWarehouse.name,
        code: mockWarehouse.code,
        address: mockWarehouse.address,
        city: mockWarehouse.city,
        state: mockWarehouse.state,
        country: mockWarehouse.country,
        zipCode: mockWarehouse.zipCode,
        latitude: mockWarehouse.latitude,
        longitude: mockWarehouse.longitude,
        priority: mockWarehouse.priority,
        isActive: mockWarehouse.isActive,
      });

      expect(prismaMock.warehouse.create).toHaveBeenCalledOnce();
      expect(result).toEqual(mockWarehouse);
    });

    it('should list all active warehouses', async () => {
      prismaMock.warehouse.findMany.mockResolvedValue([mockWarehouse]);

      const result = await inventoryService.getWarehouses();

      expect(prismaMock.warehouse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } })
      );
      expect(result).toHaveLength(1);
    });

    it('should return all warehouses including inactive when flag set', async () => {
      prismaMock.warehouse.findMany.mockResolvedValue([mockWarehouse, mockWarehouse2]);

      const result = await inventoryService.getWarehouses(true);

      expect(prismaMock.warehouse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
      expect(result).toHaveLength(2);
    });

    it('should update warehouse details', async () => {
      const updated = { ...mockWarehouse, name: 'Updated Name' };
      prismaMock.warehouse.update.mockResolvedValue(updated);

      const result = await inventoryService.updateWarehouse('wh-1', { name: 'Updated Name' });

      expect(prismaMock.warehouse.update).toHaveBeenCalledWith({
        where: { id: 'wh-1' },
        data: { name: 'Updated Name' },
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should soft-deactivate a warehouse', async () => {
      prismaMock.warehouse.update.mockResolvedValue({ ...mockWarehouse, isActive: false });

      await inventoryService.deactivateWarehouse('wh-1');

      expect(prismaMock.warehouse.update).toHaveBeenCalledWith({
        where: { id: 'wh-1' },
        data: { isActive: false },
      });
    });
  });

  // INV-04: Nearest Warehouse Routing
  describe('Nearest Warehouse Routing (INV-04)', () => {
    it('should pick the closest warehouse with sufficient stock', async () => {
      // Destination: Chicago (41.8781, -87.6298)
      // wh-1 (New York, 40.7128, -74.006): ~1200km from Chicago
      // wh-2 (LA, 34.0522, -118.2437): ~2800km from Chicago
      const items = [
        { ...mockInventoryItemWithWarehouse, quantity: 50, reserved: 5 },
        { ...mockInventoryItemWest, quantity: 50, reserved: 5 },
      ];
      prismaMock.inventoryItem.findMany.mockResolvedValue(items);

      const result = await inventoryService.findBestWarehouse('var-1', 10, 41.8781, -87.6298);

      // New York is closer to Chicago than LA
      expect(result).not.toBeNull();
      expect(result!.warehouseId).toBe('wh-1');
    });

    it('should fall back to priority when coordinates are null', async () => {
      // mockWarehouse priority=10, mockWarehouse2 priority=5
      const items = [
        { ...mockInventoryItemWithWarehouse, quantity: 50, reserved: 5 },
        { ...mockInventoryItemWest, quantity: 50, reserved: 5 },
      ];
      prismaMock.inventoryItem.findMany.mockResolvedValue(items);

      const result = await inventoryService.findBestWarehouse('var-1', 10, null as any, null as any);

      // mockWarehouse has priority=10 (higher than mockWarehouse2's priority=5)
      expect(result!.warehouseId).toBe('wh-1');
    });

    it('should return null when no warehouse has enough stock', async () => {
      const lowItem = { ...mockInventoryItemWithWarehouse, quantity: 3, reserved: 2 }; // 1 available
      prismaMock.inventoryItem.findMany.mockResolvedValue([lowItem]);

      const result = await inventoryService.findBestWarehouse('var-1', 10, 41.8781, -87.6298);

      expect(result).toBeNull();
    });
  });

  // INV-06: Dashboard Data
  describe('Inventory Dashboard (INV-06)', () => {
    it('should return aggregate stock levels across warehouses', async () => {
      prismaMock.inventoryItem.count.mockResolvedValue(200);
      prismaMock.warehouse.count.mockResolvedValue(3);
      prismaMock.$queryRaw.mockResolvedValue([{ count: 0 }]);
      prismaMock.stockMovement.findMany.mockResolvedValue([mockStockMovement]);

      const result = await inventoryService.getDashboardData();

      expect(result).toMatchObject({
        totalItems: 200,
        totalWarehouses: 3,
        recentMovements: [mockStockMovement],
      });
    });

    it('should include active low stock alerts', async () => {
      prismaMock.inventoryItem.count.mockResolvedValue(100);
      prismaMock.warehouse.count.mockResolvedValue(2);
      prismaMock.$queryRaw.mockResolvedValue([{ count: 5 }]);
      prismaMock.stockMovement.findMany.mockResolvedValue([]);

      const result = await inventoryService.getDashboardData();

      expect(result.lowStockCount).toBe(5);
    });
  });

  // INV-07: Movement History with Reason Tracking
  describe('Movement History (INV-07)', () => {
    it('should record a stock movement with reason and reference', async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue(mockInventoryItemWithWarehouse);
      prismaMock.stockMovement.create.mockResolvedValue({
        ...mockStockMovement,
        quantity: 10,
        reason: 'RESTOCK',
        reference: 'po-123',
      });
      prismaMock.inventoryItem.update.mockResolvedValue({
        ...mockInventoryItemWithWarehouse,
        quantity: 110,
      });

      await inventoryService.adjustStock('var-1', 'wh-1', 10, 'RESTOCK', 'po-123');

      expect(prismaMock.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: 10,
            reason: 'RESTOCK',
            reference: 'po-123',
          }),
        })
      );
    });

    it('should list movements for an inventory item sorted by date', async () => {
      prismaMock.stockMovement.findMany.mockResolvedValue([mockStockMovement]);
      prismaMock.stockMovement.count.mockResolvedValue(1);

      const result = await inventoryService.getMovements('inv-1');

      expect(prismaMock.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
      expect(result.movements).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter movements by reason', async () => {
      prismaMock.stockMovement.findMany.mockResolvedValue([mockStockMovement]);
      prismaMock.stockMovement.count.mockResolvedValue(1);

      await inventoryService.getMovements('inv-1', { reason: 'SALE' });

      expect(prismaMock.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ reason: 'SALE' }),
        })
      );
    });
  });

  // INV-08: SKU Auto-Generation
  describe('SKU Auto-Generation (INV-08)', () => {
    it('should generate SKU from product SKU prefix and option values', async () => {
      prismaMock.productVariant.findUnique.mockResolvedValue(null);

      const sku = await inventoryService.generateSku('TSHIRT-001', {
        size: 'Large',
        color: 'Red Blue',
      });

      // 'Large' → 'LARG', 'Red Blue' → 'REDB' (remove spaces, uppercase, first 4 chars)
      expect(sku).toBe('TSHIRT-001-LARG-REDB');
    });

    it('should handle collision by appending numeric suffix', async () => {
      prismaMock.productVariant.findUnique
        .mockResolvedValueOnce({ id: 'existing', sku: 'TSHIRT-001-LARG-REDB' }) // base taken
        .mockResolvedValueOnce(null); // -2 is free

      const sku = await inventoryService.generateSku('TSHIRT-001', {
        size: 'Large',
        color: 'Red Blue',
      });

      expect(sku).toBe('TSHIRT-001-LARG-REDB-2');
    });

    it('should uppercase and slugify option values', async () => {
      prismaMock.productVariant.findUnique.mockResolvedValue(null);

      const sku = await inventoryService.generateSku('BASE', {
        color: 'dark blue',
        size: 'xl extra',
      });

      // 'dark blue' → remove non-alphanumeric → 'DARKBLUE' → first 4 → 'DARK'
      // 'xl extra' → 'XLEXTRA' → first 4 → 'XLEX'
      expect(sku).toBe('BASE-DARK-XLEX');
    });
  });
});
