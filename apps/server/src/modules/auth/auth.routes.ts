import { Router } from 'express';
import { authController } from './auth.controller.js';
import { requireAuth, requireAdmin } from '../../common/middleware/auth.middleware.js';

const router = Router();

// Webhook route (no auth required - Clerk webhooks come with Svix signature)
router.post('/webhooks/clerk', (req, res, next) => authController.handleWebhook(req, res, next));

// User sync endpoint (for manual testing/fallback)
router.post('/sync', (req, res, next) => authController.syncUser(req, res, next));

// Protected routes
router.get('/me', requireAuth, (req, res, next) => authController.getMe(req, res, next));
router.get('/users', requireAdmin, (req, res, next) => authController.getAllUsers(req, res, next));

export { router as authRoutes };
