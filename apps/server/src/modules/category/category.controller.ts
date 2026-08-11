import { Request, Response, NextFunction } from 'express';
import { categoryService } from './category.service.js';

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
      const data = await categoryService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.getBySlug(req.params.slug);
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
      const data = await categoryService.update(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await categoryService.delete(req.params.id);
      res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
      next(error);
    }
  }

  async move(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.move(
        req.params.id,
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
      const data = await categoryService.getAttributes(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createAttribute(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.createAttribute(
        req.params.id,
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
        req.params.attributeId,
        req.body
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteAttribute(req: Request, res: Response, next: NextFunction) {
    try {
      await categoryService.deleteAttribute(req.params.attributeId);
      res.json({ success: true, message: 'Attribute deleted' });
    } catch (error) {
      next(error);
    }
  }

  // Category filter methods (manual "добавить фильтр для категории")

  async getFilters(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.getFilters(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createFilter(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.createFilter(req.params.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateFilter(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.updateFilter(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteFilter(req: Request, res: Response, next: NextFunction) {
    try {
      await categoryService.deleteFilter(req.params.id);
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
      await categoryService.deleteFilterOption(req.params.id);
      res.json({ success: true, message: 'Filter option deleted' });
    } catch (error) {
      next(error);
    }
  }

  async autoPopulateFilter(req: Request, res: Response, next: NextFunction) {
    try {
      const { count } = await categoryService.autoPopulateFilter(req.params.id);
      res.json({ success: true, data: { count }, message: `Added ${count} options` });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
