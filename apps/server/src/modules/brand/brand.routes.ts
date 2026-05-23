import { Router } from 'express';
import { brandController } from './brand.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import { createBrandSchema, updateBrandSchema } from './brand.schemas.js';

const router = Router();

// Public routes
router.get('/', (req, res, next) => brandController.getAll(req, res, next));
router.get('/slug/:slug', (req, res, next) => brandController.getBySlug(req, res, next));
router.get('/:id', (req, res, next) => brandController.getById(req, res, next));

// Admin routes
router.post(
  '/',
  requireAdmin,
  validate(createBrandSchema),
  (req, res, next) => brandController.create(req, res, next)
);
router.put(
  '/:id',
  requireAdmin,
  validate(updateBrandSchema),
  (req, res, next) => brandController.update(req, res, next)
);
router.delete('/:id', requireAdmin, (req, res, next) => brandController.delete(req, res, next));

export { router as brandRoutes };
