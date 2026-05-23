import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { wishlistService } from './wishlist.service.js';

export class WishlistController {
  async getWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const items = await wishlistService.getWishlistItems(userId!);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const item = await wishlistService.addItem(userId!, req.body.productId, req.body.priceAtAdd);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      await wishlistService.removeItem(userId!, req.params.productId as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async syncItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const count = await wishlistService.syncItems(userId!, req.body.items);
      res.json({ success: true, data: { merged: count } });
    } catch (error) {
      next(error);
    }
  }

  async updateNotifyPrefs(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const item = await wishlistService.updateNotifyPrefs(
        userId!,
        req.params.productId as string,
        req.body
      );
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async getItemCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const count = await wishlistService.getItemCount(userId!);
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }
}

export const wishlistController = new WishlistController();
