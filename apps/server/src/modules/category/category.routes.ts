import { Router } from 'express';
import { categoryController } from './category.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import {
  createCategorySchema,
  updateCategorySchema,
  moveCategorySchema,
  createCategoryAttributeSchema,
  updateCategoryAttributeSchema,
} from './category.schemas.js';

const router = Router();

// Public routes
router.get('/', (req, res, next) => categoryController.getAll(req, res, next));
router.get('/tree', (req, res, next) => categoryController.getTree(req, res, next));
router.get('/slug/:slug', (req, res, next) => categoryController.getBySlug(req, res, next));
router.get('/:id', (req, res, next) => categoryController.getById(req, res, next));
router.get('/:id/attributes', (req, res, next) => categoryController.getAttributes(req, res, next));

// Admin routes
router.post(
  '/',
  requireAdmin,
  validate(createCategorySchema),
  (req, res, next) => categoryController.create(req, res, next)
);

router.put(
  '/:id',
  requireAdmin,
  validate(updateCategorySchema),
  (req, res, next) => categoryController.update(req, res, next)
);

router.delete('/:id', requireAdmin, (req, res, next) => categoryController.delete(req, res, next));

router.patch(
  '/:id/move',
  requireAdmin,
  validate(moveCategorySchema),
  (req, res, next) => categoryController.move(req, res, next)
);

router.patch('/reorder', requireAdmin, (req, res, next) => categoryController.reorder(req, res, next));

router.post(
  '/:id/attributes',
  requireAdmin,
  validate(createCategoryAttributeSchema),
  (req, res, next) => categoryController.createAttribute(req, res, next)
);

router.put(
  '/attributes/:attributeId',
  requireAdmin,
  validate(updateCategoryAttributeSchema),
  (req, res, next) => categoryController.updateAttribute(req, res, next)
);

router.delete(
  '/attributes/:attributeId',
  requireAdmin,
  (req, res, next) => categoryController.deleteAttribute(req, res, next)
);

export { router as categoryRoutes };
