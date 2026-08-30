import type { Request, Response, NextFunction } from 'express';
import { TagType, type TagType as TagTypeValue } from '@repo/db';
import { tagService } from './tag.service.js';

function tagTypeFromQuery(value: unknown): TagTypeValue | undefined {
  if (typeof value !== 'string') return undefined;
  return Object.values(TagType).includes(value as TagTypeValue) ? (value as TagTypeValue) : undefined;
}

class TagController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const type = tagTypeFromQuery(req.query.type);

      const result = await tagService.getAll({ page, limit, type });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tag = await tagService.create(req.body);

      res.status(201).json({
        success: true,
        data: tag,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tag = await tagService.update(req.params.id as string, req.body);

      res.json({
        success: true,
        data: tag,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await tagService.delete(req.params.id as string);

      res.json({
        success: true,
        message: 'Tag deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const tagController = new TagController();
