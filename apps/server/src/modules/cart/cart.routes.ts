import { Router } from 'express';
import { cartController } from './cart.controller.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import {
  addItemSchema,
  updateQuantitySchema,
  mergeCartSchema,
  applyCouponSchema,
} from './cart.validation.js';

const router = Router();

// All cart routes require authentication (guests use Zustand localStorage only)
router.get('/', requireAuth, (req, res, next) => cartController.getCart(req, res, next));

router.post(
  '/items',
  requireAuth,
  validate(addItemSchema),
  (req, res, next) => cartController.addItem(req, res, next)
);

router.patch(
  '/items',
  requireAuth,
  validate(updateQuantitySchema),
  (req, res, next) => cartController.updateQuantity(req, res, next)
);

router.delete(
  '/items',
  requireAuth,
  (req, res, next) => cartController.removeItem(req, res, next)
);

router.delete('/', requireAuth, (req, res, next) => cartController.clearCart(req, res, next));

router.post(
  '/merge',
  requireAuth,
  validate(mergeCartSchema),
  (req, res, next) => cartController.mergeCart(req, res, next)
);

router.post(
  '/coupon',
  requireAuth,
  validate(applyCouponSchema),
  (req, res, next) => cartController.applyCoupon(req, res, next)
);

router.delete(
  '/coupon',
  requireAuth,
  (req, res, next) => cartController.removeCoupon(req, res, next)
);

router.post(
  '/coupon/validate',
  requireAuth,
  validate(applyCouponSchema),
  (req, res, next) => cartController.validateCouponOnly(req, res, next)
);

router.get(
  '/stock-validation',
  requireAuth,
  (req, res, next) => cartController.validateStock(req, res, next)
);

export { router as cartRoutes };
