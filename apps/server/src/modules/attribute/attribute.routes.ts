import { Router } from 'express';
import { attributeController } from './attribute.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import {
  createAttributeSchema,
  updateAttributeSchema,
  createAttributeValueSchema,
  updateAttributeValueSchema,
  reorderAttributesSchema,
  reorderAttributeValuesSchema,
  setProductAttributeValuesSchema,
} from './attribute.schemas.js';

const router = Router();

// ----- Attributes (public reads) -----
router.get('/category/:categoryId', (req, res, next) =>
  attributeController.getByCategory(req, res, next)
);

// ----- Product attribute values (public read; write is admin) -----
// Declared before "/:id" so "product" isn't parsed as an attribute id.
router.get('/product/:productId', (req, res, next) =>
  attributeController.getProductValues(req, res, next)
);
router.put(
  '/product/:productId',
  requireAdmin,
  validate(setProductAttributeValuesSchema),
  (req, res, next) => attributeController.setProductValues(req, res, next)
);

// ----- Attribute create + bulk reorder (admin) -----
router.post(
  '/',
  requireAdmin,
  validate(createAttributeSchema),
  (req, res, next) => attributeController.create(req, res, next)
);

// Bulk reorder — MUST precede "/:id" and "/values/:id" so "reorder" isn't parsed
// as an id.
router.put(
  '/reorder',
  requireAdmin,
  validate(reorderAttributesSchema),
  (req, res, next) => attributeController.reorder(req, res, next)
);
router.put(
  '/values/reorder',
  requireAdmin,
  validate(reorderAttributeValuesSchema),
  (req, res, next) => attributeController.reorderValues(req, res, next)
);

// ----- Attribute values CRUD (the "common option"; admin) -----
router.post(
  '/values',
  requireAdmin,
  validate(createAttributeValueSchema),
  (req, res, next) => attributeController.createValue(req, res, next)
);
router.put(
  '/values/:id',
  requireAdmin,
  validate(updateAttributeValueSchema),
  (req, res, next) => attributeController.updateValue(req, res, next)
);
router.delete('/values/:id', requireAdmin, (req, res, next) =>
  attributeController.deleteValue(req, res, next)
);

// ----- Single attribute by id (public read; write is admin) -----
router.get('/:id', (req, res, next) => attributeController.getById(req, res, next));
router.put(
  '/:id',
  requireAdmin,
  validate(updateAttributeSchema),
  (req, res, next) => attributeController.update(req, res, next)
);
router.delete('/:id', requireAdmin, (req, res, next) =>
  attributeController.delete(req, res, next)
);

export { router as attributeRoutes };
