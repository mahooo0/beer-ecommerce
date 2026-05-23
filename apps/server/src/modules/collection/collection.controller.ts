import type { Request, Response, NextFunction } from 'express';
import { collectionService } from './collection.service.js';

class CollectionController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await collectionService.getAll({ page, limit });

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
      const collection = await collectionService.getById(req.params.id as string);

      res.json({
        success: true,
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const collection = await collectionService.getBySlug(req.params.slug as string);

      res.json({
        success: true,
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const collection = await collectionService.create(req.body);

      res.status(201).json({
        success: true,
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const collection = await collectionService.update(req.params.id as string, req.body);

      res.json({
        success: true,
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await collectionService.delete(req.params.id as string);

      res.json({
        success: true,
        message: 'Collection deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async addProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, position = 0 } = req.body;
      await collectionService.addProduct(req.params.id as string, productId, position);

      res.json({
        success: true,
        message: 'Product added to collection',
      });
    } catch (error) {
      next(error);
    }
  }

  async removeProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await collectionService.removeProduct(req.params.id as string, req.params.productId as string);

      res.json({
        success: true,
        message: 'Product removed from collection',
      });
    } catch (error) {
      next(error);
    }
  }

  async reorderProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderedProductIds } = req.body;
      await collectionService.reorderProducts(req.params.id as string, orderedProductIds);

      res.json({
        success: true,
        message: 'Products reordered successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const collectionController = new CollectionController();
