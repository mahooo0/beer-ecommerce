import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  adjustStockSchema,
  getMovementsSchema,
  reserveStockSchema,
  commitReservationSchema,
  releaseReservationSchema,
  getStockSchema,
} from './inventory.validation.js';

const router = Router();

// Admin routes — dashboard, stock, alerts
router.get('/dashboard', requireAdmin, (req, res, next) => inventoryController.getDashboard(req, res, next));
router.get('/stock', requireAdmin, validate(getStockSchema), (req, res, next) => inventoryController.getStock(req, res, next));
router.get('/alerts', requireAdmin, (req, res, next) => inventoryController.getLowStockAlerts(req, res, next));

// Admin routes — Warehouse CRUD
router.post(
  '/warehouses',
  requireAdmin,
  validate(createWarehouseSchema),
  (req, res, next) => inventoryController.createWarehouse(req, res, next)
);
router.get('/warehouses', requireAdmin, (req, res, next) => inventoryController.getWarehouses(req, res, next));
router.get('/warehouses/:id', requireAdmin, (req, res, next) => inventoryController.getWarehouseById(req, res, next));
router.put(
  '/warehouses/:id',
  requireAdmin,
  validate(updateWarehouseSchema),
  (req, res, next) => inventoryController.updateWarehouse(req, res, next)
);
router.delete('/warehouses/:id', requireAdmin, (req, res, next) => inventoryController.deactivateWarehouse(req, res, next));

// Admin routes — stock adjustments and movement history
router.post(
  '/adjust',
  requireAdmin,
  validate(adjustStockSchema),
  (req, res, next) => inventoryController.adjustStock(req, res, next)
);
router.get(
  '/movements',
  requireAdmin,
  validate(getMovementsSchema),
  (req, res, next) => inventoryController.getMovements(req, res, next)
);

// Public reservation endpoints — called by checkout during payment flow
router.post('/reserve', validate(reserveStockSchema), (req, res, next) => inventoryController.reserveStock(req, res, next));
router.post('/commit', validate(commitReservationSchema), (req, res, next) => inventoryController.commitReservation(req, res, next));
router.post('/release', validate(releaseReservationSchema), (req, res, next) => inventoryController.releaseReservation(req, res, next));

export { router as inventoryRoutes };
