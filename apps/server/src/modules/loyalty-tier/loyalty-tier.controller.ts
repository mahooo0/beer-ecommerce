import type { Request, Response, NextFunction } from 'express';
import { loyaltyTierService } from './loyalty-tier.service.js';

class LoyaltyTierController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await loyaltyTierService.list();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getActive(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await loyaltyTierService.getActive();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await loyaltyTierService.getById(req.params.id as string);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await loyaltyTierService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await loyaltyTierService.update(req.params.id as string, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await loyaltyTierService.delete(req.params.id as string);
      res.json({ success: true, message: 'Loyalty tier deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const loyaltyTierController = new LoyaltyTierController();
