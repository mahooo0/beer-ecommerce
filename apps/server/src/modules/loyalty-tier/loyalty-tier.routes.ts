import { Router } from 'express';
import { loyaltyTierController } from './loyalty-tier.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import { createLoyaltyTierSchema, updateLoyaltyTierSchema } from './loyalty-tier.schemas.js';

const router = Router();

// Public: storefront / cabinet reads active tiers only.
router.get('/active', (req, res, next) => loyaltyTierController.getActive(req, res, next));

// Admin: full management (includes inactive tiers).
router.get('/', requireAdmin, (req, res, next) => loyaltyTierController.list(req, res, next));
router.get('/:id', requireAdmin, (req, res, next) => loyaltyTierController.getById(req, res, next));
router.post(
  '/',
  requireAdmin,
  validate(createLoyaltyTierSchema),
  (req, res, next) => loyaltyTierController.create(req, res, next),
);
router.put(
  '/:id',
  requireAdmin,
  validate(updateLoyaltyTierSchema),
  (req, res, next) => loyaltyTierController.update(req, res, next),
);
router.delete('/:id', requireAdmin, (req, res, next) => loyaltyTierController.delete(req, res, next));

export { router as loyaltyTierRoutes };
