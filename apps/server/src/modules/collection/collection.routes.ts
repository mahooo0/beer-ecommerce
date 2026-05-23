import { Router } from 'express';
import { collectionController } from './collection.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import {
  createCollectionSchema,
  updateCollectionSchema,
  addProductSchema,
  reorderProductsSchema,
} from './collection.schemas.js';

const router = Router();

// Public routes
router.get('/', (req, res, next) => collectionController.getAll(req, res, next));
router.get('/slug/:slug', (req, res, next) => collectionController.getBySlug(req, res, next));
router.get('/:id', (req, res, next) => collectionController.getById(req, res, next));

// Admin routes
router.post(
  '/',
  requireAdmin,
  validate(createCollectionSchema),
  (req, res, next) => collectionController.create(req, res, next)
);
router.put(
  '/:id',
  requireAdmin,
  validate(updateCollectionSchema),
  (req, res, next) => collectionController.update(req, res, next)
);
router.delete('/:id', requireAdmin, (req, res, next) => collectionController.delete(req, res, next));

// Product management
router.post(
  '/:id/products',
  requireAdmin,
  validate(addProductSchema),
  (req, res, next) => collectionController.addProduct(req, res, next)
);
router.delete(
  '/:id/products/:productId',
  requireAdmin,
  (req, res, next) => collectionController.removeProduct(req, res, next)
);
router.patch(
  '/:id/reorder',
  requireAdmin,
  validate(reorderProductsSchema),
  (req, res, next) => collectionController.reorderProducts(req, res, next)
);

export { router as collectionRoutes };
