import type { Request, Response, NextFunction } from 'express';
import { promoBannerService } from './promo-banner.service.js';

class PromoBannerController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await promoBannerService.list();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getActive(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await promoBannerService.getActive();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await promoBannerService.getById(req.params.id as string);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await promoBannerService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await promoBannerService.update(req.params.id as string, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await promoBannerService.delete(req.params.id as string);
      res.json({ success: true, message: 'Promo banner deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const promoBannerController = new PromoBannerController();
