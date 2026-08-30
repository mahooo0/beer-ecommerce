import { Request, Response, NextFunction } from 'express';
import { categoryService } from './category.service.js';
import { AppError } from '../../common/middleware/error-handler.js';

function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string') {
    throw new AppError(400, `Missing route parameter: ${name}`);
  }
  return value;
}

export class CategoryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.getAll();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getTree(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.getTree();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.getById(routeParam(req, 'id'));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.getBySlug(routeParam(req, 'slug'));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.update(routeParam(req, 'id'), req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await categoryService.delete(routeParam(req, 'id'));
      res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
      next(error);
    }
  }

  async move(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.move(
        routeParam(req, 'id'),
        req.body.newParentId,
        req.body.position
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      await categoryService.reorderSiblings(
        req.body.parentId,
        req.body.orderedIds
      );
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async getAttributes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.getAttributes(routeParam(req, 'id'));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createAttribute(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.createAttribute(
        routeParam(req, 'id'),
        req.body
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateAttribute(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.updateAttribute(
        routeParam(req, 'attributeId'),
        req.body
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteAttribute(req: Request, res: Response, next: NextFunction) {
    try {
      await categoryService.deleteAttribute(routeParam(req, 'attributeId'));
      res.json({ success: true, message: 'Attribute deleted' });
    } catch (error) {
      next(error);
    }
  }

  // Category filter methods (manual "добавить фильтр для категории")

  async getFilters(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.getFilters(routeParam(req, 'id'));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createFilter(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.createFilter(routeParam(req, 'id'), req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateFilter(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.updateFilter(routeParam(req, 'id'), req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteFilter(req: Request, res: Response, next: NextFunction) {
    try {
      await categoryService.deleteFilter(routeParam(req, 'id'));
      res.json({ success: true, message: 'Filter deleted' });
    } catch (error) {
      next(error);
    }
  }

  async createFilterOption(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.createFilterOption(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteFilterOption(req: Request, res: Response, next: NextFunction) {
    try {
      await categoryService.deleteFilterOption(routeParam(req, 'id'));
      res.json({ success: true, message: 'Filter option deleted' });
    } catch (error) {
      next(error);
    }
  }

  async autoPopulateFilter(req: Request, res: Response, next: NextFunction) {
    try {
      const { count } = await categoryService.autoPopulateFilter(routeParam(req, 'id'));
      res.json({ success: true, data: { count }, message: `Added ${count} options` });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
