import { Router } from 'express';
import { productController } from './product.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import { csvUpload } from '../../middleware/upload.middleware.js';
import {
  createProductSchema,
  updateProductRequestSchema,
  statusChangeSchema,
  bulkStatusSchema,
  bulkDeleteSchema,
} from './product.schemas.js';
import { prisma } from '@repo/db';

const router = Router();

// Option Groups endpoints
router.get('/option-groups', requireAdmin, async (req, res, next) => {
  try {
    const groups = await prisma.optionGroup.findMany({
      include: { values: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: groups });
  } catch (error) {
    next(error);
  }
});

router.post('/option-groups', requireAdmin, async (req, res, next) => {
  try {
    const { name, displayName } = req.body;
    const group = await prisma.optionGroup.create({
      data: { name, displayName: displayName || name },
      include: { values: true },
    });
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
});

router.post('/option-groups/:id/values', requireAdmin, async (req, res, next) => {
  try {
    const { value, label } = req.body;
    const optionValue = await prisma.optionValue.create({
      data: {
        value,
        label: label || value,
        groupId: req.params.id as string,
      },
    });
    res.status(201).json({ success: true, data: optionValue });
  } catch (error) {
    next(error);
  }
});

// Public routes
router.get('/', (req, res, next) => productController.getAll(req, res, next));
router.get('/filter', (req, res, next) => productController.filter(req, res, next));
router.get('/facets', (req, res, next) => productController.facets(req, res, next));
router.post('/batch', (req, res, next) => productController.getByIds(req, res, next));
router.get('/slug/:slug', (req, res, next) => productController.getBySlug(req, res, next));
router.get('/:id/related', (req, res, next) => productController.getRelated(req, res, next));
router.get('/:id/fbt', (req, res, next) => productController.getFbt(req, res, next));
router.get('/:id', (req, res, next) => productController.getById(req, res, next));

// Admin routes - CSV import (must come before /:id routes)
router.post(
  '/import',
  requireAdmin,
  csvUpload,
  (req, res, next) => productController.importProducts(req, res, next)
);

// Admin routes - bulk operations (must come before /:id routes)
router.patch(
  '/bulk/status',
  requireAdmin,
  validate(bulkStatusSchema),
  (req, res, next) => productController.bulkUpdateStatus(req, res, next)
);
router.post(
  '/bulk/delete',
  requireAdmin,
  validate(bulkDeleteSchema),
  (req, res, next) => productController.bulkDelete(req, res, next)
);

// Admin routes - single product operations
router.post(
  '/',
  requireAdmin,
  validate(createProductSchema),
  (req, res, next) => productController.create(req, res, next)
);
router.put(
  '/:id',
  requireAdmin,
  validate(updateProductRequestSchema),
  (req, res, next) => productController.update(req, res, next)
);
router.patch(
  '/:id/status',
  requireAdmin,
  validate(statusChangeSchema),
  (req, res, next) => productController.updateStatus(req, res, next)
);
router.delete('/:id', requireAdmin, (req, res, next) => productController.delete(req, res, next));

export { router as productRoutes };
