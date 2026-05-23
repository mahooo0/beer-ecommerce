import { Router } from 'express';
import { wishlistController } from './wishlist.controller.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import { addItemSchema, syncSchema, notifySchema } from './wishlist.validation.js';

const router = Router();

// All wishlist routes require authentication (guests use localStorage only)
router.get('/', requireAuth, (req, res, next) => wishlistController.getWishlist(req, res, next));
router.get('/count', requireAuth, (req, res, next) => wishlistController.getItemCount(req, res, next));
router.post(
  '/',
  requireAuth,
  validate(addItemSchema),
  (req, res, next) => wishlistController.addItem(req, res, next)
);
router.delete('/:productId', requireAuth, (req, res, next) => wishlistController.removeItem(req, res, next));
router.post(
  '/sync',
  requireAuth,
  validate(syncSchema),
  (req, res, next) => wishlistController.syncItems(req, res, next)
);
router.patch(
  '/:productId/notify',
  requireAuth,
  validate(notifySchema),
  (req, res, next) => wishlistController.updateNotifyPrefs(req, res, next)
);

export { router as wishlistRoutes };
