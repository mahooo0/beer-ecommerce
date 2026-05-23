import type { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service.js';
import { prisma } from '@repo/db';
import { AppError } from '../../common/middleware/error-handler.js';

export class InventoryController {
  // INV-06: Dashboard summary
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.getDashboardData();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // INV-01: Get stock — by variant or specific variant+warehouse pair
  async getStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { variantId, warehouseId } = req.query as { variantId?: string; warehouseId?: string };

      if (!variantId) {
        throw new AppError(400, 'variantId query parameter is required');
      }

      let data;
      if (warehouseId) {
        data = await inventoryService.getStockLevel(variantId, warehouseId);
      } else {
        data = await inventoryService.getStockByVariant(variantId);
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // INV-02: Get low stock alerts
  async getLowStockAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.getLowStockAlerts();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // INV-03: Create warehouse
  async createWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouse = await inventoryService.createWarehouse(req.body);
      res.status(201).json({ success: true, data: warehouse });
    } catch (error) {
      next(error);
    }
  }

  // INV-03: Get all warehouses
  async getWarehouses(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const data = await inventoryService.getWarehouses(includeInactive);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // INV-03: Get a single warehouse by ID
  async getWarehouseById(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: req.params.id as string },
        include: { inventoryItems: { select: { id: true, variantId: true, quantity: true, reserved: true, lowStockThreshold: true } } },
      });

      if (!warehouse) {
        throw new AppError(404, 'Warehouse not found');
      }

      res.json({ success: true, data: warehouse });
    } catch (error) {
      next(error);
    }
  }

  // INV-03: Update warehouse
  async updateWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.updateWarehouse(req.params.id as string, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // INV-03: Deactivate warehouse (soft delete)
  async deactivateWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.deactivateWarehouse(req.params.id as string);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // INV-07: Adjust stock quantity and record movement
  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { variantId, warehouseId, quantity, reason, reference, note } = req.body;
      const data = await inventoryService.adjustStock(variantId, warehouseId, quantity, reason, reference, note);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // INV-07: Get stock movement history
  async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const { inventoryItemId, reason, page, limit } = req.query as {
        inventoryItemId?: string;
        reason?: string;
        page?: string;
        limit?: string;
      };

      const data = await inventoryService.getMovements(inventoryItemId ?? '', {
        reason: reason as any,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // INV-05: Reserve stock for a checkout session
  async reserveStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { variantId, warehouseId, quantity, checkoutSessionId } = req.body;

      let resolvedWarehouseId = warehouseId;

      // Auto-select best warehouse if not provided
      if (!resolvedWarehouseId) {
        const best = await inventoryService.findBestWarehouse(variantId, quantity, null, null);
        if (!best) {
          throw new AppError(409, 'Insufficient stock in any warehouse');
        }
        resolvedWarehouseId = best.warehouseId;
      }

      const data = await inventoryService.reserveStock(variantId, resolvedWarehouseId, quantity, checkoutSessionId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // INV-05: Commit reservation (payment successful)
  async commitReservation(req: Request, res: Response, next: NextFunction) {
    try {
      await inventoryService.commitReservation(req.body.checkoutSessionId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // INV-05: Release reservation (payment cancelled/failed)
  async releaseReservation(req: Request, res: Response, next: NextFunction) {
    try {
      await inventoryService.releaseReservation(req.body.checkoutSessionId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
