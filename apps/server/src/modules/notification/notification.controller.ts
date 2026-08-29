import type { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service.js';

class NotificationController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const unreadOnly = req.query.unreadOnly === 'true';
      const data = await notificationService.list({ limit, unreadOnly });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async unreadCount(_req: Request, res: Response, next: NextFunction) {
    try {
      const count = await notificationService.unreadCount();
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await notificationService.markRead(req.params.id as string);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(_req: Request, res: Response, next: NextFunction) {
    try {
      const count = await notificationService.markAllRead();
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
