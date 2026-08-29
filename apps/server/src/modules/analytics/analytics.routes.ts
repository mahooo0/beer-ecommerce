import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';

const router = Router();

// Public: storefront beacons (guests + signed-in). Not an auth boundary.
router.post('/track', (req, res, next) => analyticsController.track(req, res, next));

// Admin: behavioral reports (funnel + abandoned carts) for the analytics screen.
router.get('/summary', requireAdmin, (req, res, next) => analyticsController.getSummary(req, res, next));

export { router as analyticsRoutes };
