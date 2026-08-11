import { Router } from 'express';
import { promoBannerController } from './promo-banner.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import { createPromoBannerSchema, updatePromoBannerSchema } from './promo-banner.schemas.js';

const router = Router();

// Public: storefront reads active banners only.
router.get('/active', (req, res, next) => promoBannerController.getActive(req, res, next));

// Admin: full management (includes inactive banners).
router.get('/', requireAdmin, (req, res, next) => promoBannerController.list(req, res, next));
router.get('/:id', requireAdmin, (req, res, next) => promoBannerController.getById(req, res, next));
router.post(
  '/',
  requireAdmin,
  validate(createPromoBannerSchema),
  (req, res, next) => promoBannerController.create(req, res, next),
);
router.put(
  '/:id',
  requireAdmin,
  validate(updatePromoBannerSchema),
  (req, res, next) => promoBannerController.update(req, res, next),
);
router.delete('/:id', requireAdmin, (req, res, next) => promoBannerController.delete(req, res, next));

export { router as promoBannerRoutes };
