import { prisma } from '@repo/db';
import { AppError } from '../../common/middleware/error-handler.js';
import { eventBus } from '../../common/events/event-bus.js';

// Helper: calculate available stock
function available(item: { quantity: number; reserved: number }): number {
  return item.quantity - item.reserved;
}

// Helper: Haversine distance in km between two lat/lon points
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface CreateWarehouseData {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude?: number | null;
  longitude?: number | null;
  priority?: number;
  isActive?: boolean;
}

interface UpdateWarehouseData {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  priority?: number;
  isActive?: boolean;
}

interface GetMovementsOptions {
  page?: number;
  limit?: number;
  reason?: string;
  inventoryItemId?: string;
}

type StockMovementReason =
  | 'SALE'
  | 'RETURN'
  | 'MANUAL_ADJUSTMENT'
  | 'DAMAGE'
  | 'RESTOCK'
  | 'RESERVATION'
  | 'RESERVATION_RELEASE';

export class InventoryService {
  // INV-01: Get stock for all warehouses for a variant
  async getStockByVariant(variantId: string) {
    const items = await prisma.inventoryItem.findMany({
      where: { variantId },
      include: { warehouse: true },
    });

    return items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      warehouseId: item.warehouseId,
      warehouseName: item.warehouse.name,
      quantity: item.quantity,
      reserved: item.reserved,
      available: available(item),
      lowStockThreshold: item.lowStockThreshold,
    }));
  }

  // INV-01: Get stock for a specific variant-warehouse pair
  async getStockLevel(variantId: string, warehouseId: string) {
    const item = await prisma.inventoryItem.findUnique({
      where: { variantId_warehouseId: { variantId, warehouseId } },
      include: { warehouse: true },
    });

    if (!item) {
      throw new AppError(404, 'Inventory item not found');
    }

    return {
      id: item.id,
      variantId: item.variantId,
      warehouseId: item.warehouseId,
      warehouseName: item.warehouse.name,
      quantity: item.quantity,
      reserved: item.reserved,
      available: available(item),
      lowStockThreshold: item.lowStockThreshold,
    };
  }

  // INV-02: Get all items where available <= threshold
  async getLowStockAlerts() {
    const items = await prisma.$queryRaw<any[]>`
      SELECT
        ii.id,
        ii."variantId",
        ii."warehouseId",
        ii.quantity,
        ii.reserved,
        ii."lowStockThreshold",
        (ii.quantity - ii.reserved) AS available,
        pv.sku,
        p.name AS "productName",
        w.name AS "warehouseName"
      FROM inventory_items ii
      JOIN product_variants pv ON pv.id = ii."variantId"
      JOIN products p ON p.id = pv."productId"
      JOIN warehouses w ON w.id = ii."warehouseId"
      WHERE (ii.quantity - ii.reserved) <= ii."lowStockThreshold"
      ORDER BY available ASC
    `;
    return items;
  }

  // INV-03: Warehouse CRUD
  async createWarehouse(data: CreateWarehouseData) {
    return prisma.warehouse.create({
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        priority: data.priority ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async getWarehouses(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return prisma.warehouse.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async updateWarehouse(id: string, data: UpdateWarehouseData) {
    try {
      return await prisma.warehouse.update({
        where: { id },
        data,
      });
    } catch {
      throw new AppError(404, 'Warehouse not found');
    }
  }

  async deactivateWarehouse(id: string) {
    try {
      return await prisma.warehouse.update({
        where: { id },
        data: { isActive: false },
      });
    } catch {
      throw new AppError(404, 'Warehouse not found');
    }
  }

  // INV-04: Find best warehouse using Haversine or priority fallback
  async findBestWarehouse(
    variantId: string,
    qty: number,
    destLat: number | null,
    destLon: number | null
  ) {
    const items = await prisma.inventoryItem.findMany({
      where: { variantId, warehouse: { isActive: true } },
      include: { warehouse: true },
    });

    // Filter to only warehouses with sufficient available stock
    const eligible = items.filter((item) => available(item) >= qty);

    if (eligible.length === 0) {
      return null;
    }

    // Sort by distance if coordinates are provided, otherwise by priority (desc)
    eligible.sort((a, b) => {
      if (
        destLat !== null &&
        destLon !== null &&
        a.warehouse.latitude !== null &&
        b.warehouse.latitude !== null &&
        a.warehouse.longitude !== null &&
        b.warehouse.longitude !== null
      ) {
        const da = haversineDistance(
          destLat,
          destLon,
          a.warehouse.latitude,
          a.warehouse.longitude
        );
        const db = haversineDistance(
          destLat,
          destLon,
          b.warehouse.latitude,
          b.warehouse.longitude
        );
        return da - db; // ascending: closest first
      }
      // Fallback: highest priority first
      return b.warehouse.priority - a.warehouse.priority;
    });

    const best = eligible[0]!;
    return {
      inventoryItemId: best.id,
      variantId: best.variantId,
      warehouseId: best.warehouseId,
      warehouseName: best.warehouse.name,
      available: available(best),
    };
  }

  // INV-07: Adjust stock and record movement
  async adjustStock(
    variantId: string,
    warehouseId: string,
    quantity: number,
    reason: StockMovementReason,
    reference?: string,
    note?: string
  ) {
    const item = await prisma.inventoryItem.findUnique({
      where: { variantId_warehouseId: { variantId, warehouseId } },
    });

    if (!item) {
      throw new AppError(404, 'Inventory item not found');
    }

    // Record movement
    await prisma.stockMovement.create({
      data: {
        inventoryItemId: item.id,
        quantity,
        reason,
        reference: reference ?? null,
        note: note ?? null,
      },
    });

    // Update quantity
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { quantity: { increment: quantity } },
    });

    const newAvailable = available(updatedItem);

    // Emit stock updated event
    eventBus.emit('inventory.stockUpdated', {
      variantId,
      warehouseId,
      quantity: updatedItem.quantity,
      available: newAvailable,
    });

    // Emit low stock alert if threshold breached
    if (newAvailable <= updatedItem.lowStockThreshold) {
      eventBus.emit('inventory.lowStock', {
        variantId,
        warehouseId,
        available: newAvailable,
        threshold: updatedItem.lowStockThreshold,
      });
    }

    return updatedItem;
  }

  // INV-07: Get paginated movement history
  async getMovements(inventoryItemId: string, options: GetMovementsOptions = {}) {
    const { page = 1, limit = 50, reason } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = { inventoryItemId };
    if (reason) {
      where.reason = reason;
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return { movements, total, page, limit };
  }

  // INV-08: Auto-generate SKU and ensure uniqueness
  async generateSku(productSku: string, options: Record<string, string>): Promise<string> {
    // Build option suffix: uppercase, remove non-alphanumeric, take first 4 chars per value
    const parts = Object.values(options).map((v) =>
      v
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 4)
    );

    const baseSku = `${productSku}-${parts.join('-')}`;

    // Check uniqueness; append -2, -3 etc. if collision
    const existing = await prisma.productVariant.findUnique({
      where: { sku: baseSku },
    });

    if (!existing) {
      return baseSku;
    }

    let suffix = 2;
    while (true) {
      const candidate = `${baseSku}-${suffix}`;
      const collision = await prisma.productVariant.findUnique({
        where: { sku: candidate },
      });
      if (!collision) {
        return candidate;
      }
      suffix++;
    }
  }

  // INV-05: Reserve stock atomically within a transaction
  async reserveStock(
    variantId: string,
    warehouseId: string,
    qty: number,
    checkoutSessionId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { variantId_warehouseId: { variantId, warehouseId } },
      });

      if (!item) {
        throw new AppError(404, 'Inventory item not found');
      }

      if (available(item) < qty) {
        throw new AppError(409, 'Insufficient stock');
      }

      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { reserved: { increment: qty } },
      });

      await tx.stockMovement.create({
        data: {
          inventoryItemId: item.id,
          quantity: -qty,
          reason: 'RESERVATION' as StockMovementReason,
          reference: checkoutSessionId,
        },
      });

      return updated;
    });
  }

  // INV-05: Commit reservation — convert to sale and decrement quantity
  async commitReservation(checkoutSessionId: string): Promise<void> {
    const reservations = await prisma.stockMovement.findMany({
      where: { reason: 'RESERVATION', reference: checkoutSessionId },
    });

    if (reservations.length === 0) {
      return;
    }

    for (const reservation of reservations) {
      const qty = Math.abs(reservation.quantity);

      await prisma.$transaction(async (tx) => {
        await tx.inventoryItem.update({
          where: { id: reservation.inventoryItemId },
          data: {
            quantity: { decrement: qty },
            reserved: { decrement: qty },
          },
        });

        await tx.stockMovement.create({
          data: {
            inventoryItemId: reservation.inventoryItemId,
            quantity: -qty,
            reason: 'SALE' as StockMovementReason,
            reference: checkoutSessionId,
          },
        });
      });

      // Check low stock and emit events after each commit
      const updatedItem = await prisma.inventoryItem.findUnique({
        where: { id: reservation.inventoryItemId },
      });

      if (updatedItem) {
        const newAvailable = available(updatedItem);
        eventBus.emit('inventory.stockUpdated', {
          variantId: updatedItem.variantId,
          warehouseId: updatedItem.warehouseId,
          quantity: updatedItem.quantity,
          available: newAvailable,
        });

        if (newAvailable <= updatedItem.lowStockThreshold) {
          eventBus.emit('inventory.lowStock', {
            variantId: updatedItem.variantId,
            warehouseId: updatedItem.warehouseId,
            available: newAvailable,
            threshold: updatedItem.lowStockThreshold,
          });
        }
      }
    }
  }

  // INV-05: Release reservation idempotently
  async releaseReservation(checkoutSessionId: string): Promise<void> {
    // Find all RESERVATION movements for this session
    const reservations = await prisma.stockMovement.findMany({
      where: { reason: 'RESERVATION', reference: checkoutSessionId },
    });

    if (reservations.length === 0) {
      return; // Already released or never reserved
    }

    // Check which ones already have a matching RESERVATION_RELEASE
    const releases = await prisma.stockMovement.findMany({
      where: { reason: 'RESERVATION_RELEASE', reference: checkoutSessionId },
    });

    const releasedItemIds = new Set(releases.map((r) => r.inventoryItemId));
    const unreleasedReservations = reservations.filter(
      (r) => !releasedItemIds.has(r.inventoryItemId)
    );

    if (unreleasedReservations.length === 0) {
      return; // Idempotent: already released
    }

    for (const reservation of unreleasedReservations) {
      const qty = Math.abs(reservation.quantity);

      await prisma.$transaction(async (tx) => {
        await tx.inventoryItem.update({
          where: { id: reservation.inventoryItemId },
          data: { reserved: { decrement: qty } },
        });

        await tx.stockMovement.create({
          data: {
            inventoryItemId: reservation.inventoryItemId,
            quantity: qty,
            reason: 'RESERVATION_RELEASE' as StockMovementReason,
            reference: checkoutSessionId,
          },
        });
      });
    }
  }

  // INV-05: Find and release all reservations older than 15 minutes
  async releaseExpiredReservations(): Promise<number> {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);

    // Find all RESERVATION movements older than 15 minutes
    const expiredReservations = await prisma.stockMovement.findMany({
      where: {
        reason: 'RESERVATION',
        createdAt: { lt: cutoff },
      },
    });

    if (expiredReservations.length === 0) {
      return 0;
    }

    // Find which ones already have a RESERVATION_RELEASE
    const references = [...new Set(expiredReservations.map((r) => r.reference).filter(Boolean))];

    const existingReleases = await prisma.stockMovement.findMany({
      where: {
        reason: 'RESERVATION_RELEASE',
        reference: { in: references as string[] },
      },
    });

    const releasedRefs = new Set(existingReleases.map((r) => r.reference));
    const unreleasedRefs = references.filter((ref) => !releasedRefs.has(ref));

    let count = 0;
    for (const ref of unreleasedRefs) {
      await this.releaseReservation(ref as string);
      count++;
    }

    return count;
  }

  // INV-06: Dashboard summary data
  async getDashboardData() {
    const [totalItems, totalWarehouses, lowStockItems, recentMovements] = await Promise.all([
      prisma.inventoryItem.count(),
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int AS count
        FROM inventory_items
        WHERE (quantity - reserved) <= "lowStockThreshold"
      `,
      prisma.stockMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // lowStockItems is an array from queryRaw — extract count
    const lowStockCount =
      Array.isArray(lowStockItems) && lowStockItems.length > 0
        ? parseInt(String(lowStockItems[0]?.count ?? '0'), 10)
        : 0;

    return {
      totalItems,
      totalWarehouses,
      lowStockCount,
      recentMovements,
    };
  }
}

export const inventoryService = new InventoryService();
