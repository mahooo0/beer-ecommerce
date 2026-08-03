import { Request, Response, NextFunction } from 'express';
import { attributeService } from './attribute.service.js';

export class AttributeController {
  // ========================================
  // ATTRIBUTE CRUD
  // ========================================

  async getByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attributeService.getByCategory(req.params.categoryId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attributeService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attributeService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attributeService.update(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await attributeService.delete(req.params.id);
      res.json({ success: true, message: 'Attribute deleted' });
    } catch (error) {
      next(error);
    }
  }

  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      await attributeService.reorder(req.body);
      res.json({ success: true, message: 'Attributes reordered' });
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // ATTRIBUTE VALUE CRUD (the "common option")
  // ========================================

  async createValue(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attributeService.createValue(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateValue(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attributeService.updateValue(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteValue(req: Request, res: Response, next: NextFunction) {
    try {
      await attributeService.deleteValue(req.params.id);
      res.json({ success: true, message: 'Attribute value deleted' });
    } catch (error) {
      next(error);
    }
  }

  async reorderValues(req: Request, res: Response, next: NextFunction) {
    try {
      await attributeService.reorderValues(req.body);
      res.json({ success: true, message: 'Attribute values reordered' });
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // PRODUCT ATTRIBUTE VALUES
  // ========================================

  async getProductValues(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attributeService.getProductValues(req.params.productId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async setProductValues(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attributeService.setProductValues(
        req.params.productId,
        req.body.values
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const attributeController = new AttributeController();
