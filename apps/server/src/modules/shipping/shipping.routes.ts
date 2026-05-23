import { Router } from 'express';
import { shippingController } from './shipping.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import {
  createShippingZoneSchema,
  updateShippingZoneSchema,
  createShippingMethodSchema,
  updateShippingMethodSchema,
  calculateRateSchema,
} from './shipping.validation.js';

const router = Router();

// Public route - rate calculation (for checkout)
router.post(
  '/calculate',
  validate(calculateRateSchema),
  (req, res, next) => shippingController.getAvailableShippingMethods(req, res, next)
);

// Admin routes - Zone CRUD
router.post(
  '/zones',
  requireAdmin,
  validate(createShippingZoneSchema),
  (req, res, next) => shippingController.createZone(req, res, next)
);
router.get('/zones', requireAdmin, (req, res, next) => shippingController.getAllZones(req, res, next));
router.get('/zones/:id', requireAdmin, (req, res, next) => shippingController.getZoneById(req, res, next));
router.put(
  '/zones/:id',
  requireAdmin,
  validate(updateShippingZoneSchema),
  (req, res, next) => shippingController.updateZone(req, res, next)
);
router.delete('/zones/:id', requireAdmin, (req, res, next) => shippingController.deleteZone(req, res, next));

// Admin routes - Method CRUD
router.post(
  '/zones/:zoneId/methods',
  requireAdmin,
  validate(createShippingMethodSchema),
  (req, res, next) => shippingController.createMethod(req, res, next)
);
router.get(
  '/zones/:zoneId/methods',
  requireAdmin,
  (req, res, next) => shippingController.getMethodsByZone(req, res, next)
);
router.put(
  '/methods/:id',
  requireAdmin,
  validate(updateShippingMethodSchema),
  (req, res, next) => shippingController.updateMethod(req, res, next)
);
router.delete('/methods/:id', requireAdmin, (req, res, next) => shippingController.deleteMethod(req, res, next));

export { router as shippingRoutes };
