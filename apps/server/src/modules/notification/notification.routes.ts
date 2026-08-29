import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';

const router = Router();

// All admin-only: the notification feed is the admin shell's bell.
router.get('/', requireAdmin, (req, res, next) => notificationController.list(req, res, next));
router.get('/unread-count', requireAdmin, (req, res, next) => notificationController.unreadCount(req, res, next));
router.post('/read-all', requireAdmin, (req, res, next) => notificationController.markAllRead(req, res, next));
router.patch('/:id/read', requireAdmin, (req, res, next) => notificationController.markRead(req, res, next));

export { router as notificationRoutes };
