import { Request, Response, NextFunction } from 'express';
import { attributeService } from './attribute.service.js';
import { AppError } from '../../common/middleware/error-handler.js';

function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string') {
    throw new AppError(400, `Missing route parameter: ${name}`);
  }
  return value;
}

export class AttributeController {
  // ========================================
  // ATTRIBUTE CRUD
  // ========================================

  async getByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attributeService.getByCategory(routeParam(req, 'categoryId'));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attributeService.getById(routeParam(req, 'id'));
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
      const data = await attributeService.update(routeParam(req, 'id'), req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await attributeService.delete(routeParam(req, 'id'));
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
      const data = await attributeService.updateValue(routeParam(req, 'id'), req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteValue(req: Request, res: Response, next: NextFunction) {
    try {
      await attributeService.deleteValue(routeParam(req, 'id'));
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
      const data = await attributeService.getProductValues(routeParam(req, 'productId'));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async setProductValues(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attributeService.setProductValues(
        routeParam(req, 'productId'),
        req.body.values
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const attributeController = new AttributeController();
