import type { Request, Response, NextFunction } from 'express';
import { blogService, isBlogCollection, type BlogCollection, type CmsError } from './blog.service.js';

/** Raw querystring (Payload query language) forwarded verbatim to the CMS. */
function qs(req: Request): string {
  const i = req.originalUrl.indexOf('?');
  return i >= 0 ? req.originalUrl.slice(i + 1) : '';
}

/** Validate the :collection param against the whitelist; 404 if unknown. */
function collectionOf(req: Request, res: Response): BlogCollection | null {
  const collection = req.params.collection as string;
  if (!isBlogCollection(collection)) {
    res.status(404).json({ success: false, error: `Unknown blog collection: ${collection}` });
    return null;
  }
  return collection;
}

/** Forward the CMS response; on a CMS error, relay its status + body. */
async function relay(res: Response, next: NextFunction, promise: Promise<unknown>) {
  try {
    res.json(await promise);
  } catch (error) {
    const err = error as CmsError;
    if (typeof err.status === 'number') {
      res.status(err.status).json(err.body ?? { success: false, error: err.message });
      return;
    }
    next(error);
  }
}

class BlogController {
  async list(req: Request, res: Response, next: NextFunction) {
    const c = collectionOf(req, res);
    if (!c) return;
    await relay(res, next, blogService.list(c, qs(req)));
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    const c = collectionOf(req, res);
    if (!c) return;
    await relay(res, next, blogService.getOne(c, req.params.id as string, qs(req)));
  }

  async create(req: Request, res: Response, next: NextFunction) {
    const c = collectionOf(req, res);
    if (!c) return;
    await relay(res, next, blogService.create(c, req.body, qs(req)));
  }

  async update(req: Request, res: Response, next: NextFunction) {
    const c = collectionOf(req, res);
    if (!c) return;
    await relay(res, next, blogService.update(c, req.params.id as string, req.body, qs(req)));
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    const c = collectionOf(req, res);
    if (!c) return;
    await relay(res, next, blogService.remove(c, req.params.id as string, qs(req)));
  }

  async uploadMedia(req: Request, res: Response, next: NextFunction) {
    const contentType = (req.headers['content-type'] as string) || 'multipart/form-data';
    const body = req.body as Buffer;
    await relay(res, next, blogService.uploadMedia(contentType, body, qs(req)));
  }
}

export const blogController = new BlogController();
