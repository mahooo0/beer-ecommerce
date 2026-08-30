import { Router } from 'express';
import { orderController } from './order.controller.js';
import { requireAuth, requireAdmin } from '../../common/middleware/auth.middleware.js';

const router = Router();

router.get('/stats', requireAdmin, (req, res, next) => orderController.getStats(req, res, next));
router.get('/aggregate/by-user', requireAdmin, (req, res, next) => orderController.getCustomerAggregates(req, res, next));
router.get('/', requireAdmin, (req, res, next) => orderController.getAll(req, res, next));
router.get('/user/:userId/spend', requireAuth, (req, res, next) => orderController.getUserSpend(req, res, next));
router.get('/user/:userId', requireAuth, (req, res, next) => orderController.getByUserId(req, res, next));
// Public: guests need to read their confirmation by order id (id is an unguessable ObjectId).
router.get('/:id', (req, res, next) => orderController.getById(req, res, next));
// Optional auth: both signed-in and guest customers place orders (see controller getAuth).
router.post('/', (req, res, next) => orderController.create(req, res, next));
router.patch('/:id/status', requireAdmin, (req, res, next) => orderController.updateStatus(req, res, next));
router.patch('/:id/tracking', requireAdmin, (req, res, next) => orderController.addTracking(req, res, next));
router.post('/:id/refund', requireAdmin, (req, res, next) => orderController.processRefund(req, res, next));

export { router as orderRoutes };
