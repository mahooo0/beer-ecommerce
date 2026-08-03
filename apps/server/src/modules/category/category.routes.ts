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
  createCategoryFilterSchema,
  updateCategoryFilterSchema,
  createFilterOptionSchema,
} from './category.schemas.js';

const router = Router();

// Public routes
router.get('/', (req, res, next) => categoryController.getAll(req, res, next));
router.get('/tree', (req, res, next) => categoryController.getTree(req, res, next));
router.get('/slug/:slug', (req, res, next) => categoryController.getBySlug(req, res, next));
router.get('/:id', (req, res, next) => categoryController.getById(req, res, next));
router.get('/:id/attributes', (req, res, next) => categoryController.getAttributes(req, res, next));
router.get('/:id/filters', (req, res, next) => categoryController.getFilters(req, res, next));

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

// Category filter routes (manual "добавить фильтр для категории").
// Declare the literal `/filters/options*` routes BEFORE the `/filters/:id`
// param route so "options" is never captured as an :id.
router.post(
  '/:id/filters',
  requireAdmin,
  validate(createCategoryFilterSchema),
  (req, res, next) => categoryController.createFilter(req, res, next)
);

router.post(
  '/filters/options',
  requireAdmin,
  validate(createFilterOptionSchema),
  (req, res, next) => categoryController.createFilterOption(req, res, next)
);

router.delete(
  '/filters/options/:id',
  requireAdmin,
  (req, res, next) => categoryController.deleteFilterOption(req, res, next)
);

router.post(
  '/filters/:id/auto-populate',
  requireAdmin,
  (req, res, next) => categoryController.autoPopulateFilter(req, res, next)
);

router.put(
  '/filters/:id',
  requireAdmin,
  validate(updateCategoryFilterSchema),
  (req, res, next) => categoryController.updateFilter(req, res, next)
);

router.delete(
  '/filters/:id',
  requireAdmin,
  (req, res, next) => categoryController.deleteFilter(req, res, next)
);

export { router as categoryRoutes };
