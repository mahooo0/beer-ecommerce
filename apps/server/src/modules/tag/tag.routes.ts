import { Router } from 'express';
import { tagController } from './tag.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import { createTagSchema, updateTagSchema } from './tag.schemas.js';

const router = Router();

// Public routes
router.get('/', (req, res, next) => tagController.getAll(req, res, next));

// Admin routes
router.post(
  '/',
  requireAdmin,
  validate(createTagSchema),
  (req, res, next) => tagController.create(req, res, next)
);
router.put(
  '/:id',
  requireAdmin,
  validate(updateTagSchema),
  (req, res, next) => tagController.update(req, res, next)
);
router.delete('/:id', requireAdmin, (req, res, next) => tagController.delete(req, res, next));

export { router as tagRoutes };
