import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { analyticsService } from './analytics.service.js';

class AnalyticsController {
  /**
   * Public beacon endpoint. Accepts a single event from the storefront. The
   * signed-in Clerk id (if any) is preferred over the client-sent userId for
   * attribution; sessionId + payload come from the body.
   */
  async track(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const event = await analyticsService.track({
        ...req.body,
        userId: userId ?? req.body?.userId ?? null,
      });
      res.status(201).json({ success: true, data: { id: event.id } });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, checkoutWindowMin, cartWindowHours } = req.query;
      const data = await analyticsService.getSummary({
        from: typeof from === 'string' ? from : undefined,
        to: typeof to === 'string' ? to : undefined,
        checkoutWindowMin: checkoutWindowMin ? Number(checkoutWindowMin) : undefined,
        cartWindowHours: cartWindowHours ? Number(cartWindowHours) : undefined,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
