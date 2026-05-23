import { Router } from 'express';
import { orderController } from './order.controller.js';
import { requireAuth, requireAdmin } from '../../common/middleware/auth.middleware.js';

const router = Router();

router.get('/stats', requireAdmin, (req, res, next) => orderController.getStats(req, res, next));
router.get('/', requireAdmin, (req, res, next) => orderController.getAll(req, res, next));
router.get('/user/:userId', requireAuth, (req, res, next) => orderController.getByUserId(req, res, next));
router.get('/:id', requireAuth, (req, res, next) => orderController.getById(req, res, next));
router.post('/', requireAuth, (req, res, next) => orderController.create(req, res, next));
router.patch('/:id/status', requireAdmin, (req, res, next) => orderController.updateStatus(req, res, next));
router.patch('/:id/tracking', requireAdmin, (req, res, next) => orderController.addTracking(req, res, next));
router.post('/:id/refund', requireAdmin, (req, res, next) => orderController.processRefund(req, res, next));

export { router as orderRoutes };
