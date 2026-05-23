import { Router } from 'express';
import { paymentController } from './payment.controller.js';
import { requireAuth, requireAdmin } from '../../common/middleware/auth.middleware.js';

const router = Router();

router.post('/create-intent', requireAuth, (req, res, next) => paymentController.createPaymentIntent(req, res, next));
router.post('/webhook', (req, res, next) => paymentController.handleWebhook(req, res, next));
router.post('/refund', requireAdmin, (req, res, next) => paymentController.createRefund(req, res, next));
router.get('/:paymentIntentId', requireAdmin, (req, res, next) => paymentController.getPaymentIntent(req, res, next));

export { router as paymentRoutes };
