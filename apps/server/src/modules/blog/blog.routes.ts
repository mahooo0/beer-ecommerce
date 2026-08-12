import express, { Router } from 'express';
import { blogController } from './blog.controller.js';
import { requireAdmin } from '../../common/middleware/auth.middleware.js';

const router = Router();

// Every blog/content route is admin-only (Clerk). The Payload API key is applied
// server-side in blog.service — the browser never sees it.
router.use(requireAdmin);

// Media upload: capture the raw multipart body (json parser skips it) and
// forward it verbatim to Payload. Defined before the generic collection routes.
router.post(
  '/media/upload',
  express.raw({ type: 'multipart/form-data', limit: '25mb' }),
  (req, res, next) => blogController.uploadMedia(req, res, next),
);

router.get('/:collection', (req, res, next) => blogController.list(req, res, next));
router.get('/:collection/:id', (req, res, next) => blogController.getOne(req, res, next));
router.post('/:collection', (req, res, next) => blogController.create(req, res, next));
router.patch('/:collection/:id', (req, res, next) => blogController.update(req, res, next));
router.delete('/:collection/:id', (req, res, next) => blogController.remove(req, res, next));

export { router as blogRoutes };
