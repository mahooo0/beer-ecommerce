import { Router } from 'express';
import { paymentController } from './payment.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';

const router = Router();

// Optional auth: guests pay too. The amount comes from the order, so this is safe to open.
router.post('/create-intent', (req, res, next) => paymentController.createPaymentIntent(req, res, next));
router.post('/webhook', (req, res, next) => paymentController.handleWebhook(req, res, next));
router.post('/refund', requireAdmin, (req, res, next) => paymentController.createRefund(req, res, next));
router.get('/:paymentIntentId', requireAdmin, (req, res, next) => paymentController.getPaymentIntent(req, res, next));

export { router as paymentRoutes };
