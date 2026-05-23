import type { Request, Response, NextFunction } from 'express';
import { brandService } from './brand.service.js';

class BrandController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await brandService.getAll({ page, limit });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await brandService.getById(req.params.id as string);

      res.json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await brandService.getBySlug(req.params.slug as string);

      res.json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await brandService.create(req.body);

      res.status(201).json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await brandService.update(req.params.id as string, req.body);

      res.json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await brandService.delete(req.params.id as string);

      res.json({
        success: true,
        message: 'Brand deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const brandController = new BrandController();
