import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { cartService } from './cart.service.js';
import {
  addItemBodySchema,
  updateQuantityBodySchema,
  removeItemBodySchema,
  mergeCartBodySchema,
  applyCouponBodySchema,
} from './cart.validation.js';

export class CartController {
  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const cart = await cartService.getOrCreateCart(userId!);
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const parsed = addItemBodySchema.parse(req.body);
      const cart = await cartService.addItem(userId!, parsed);
      res.status(201).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async updateQuantity(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const parsed = updateQuantityBodySchema.parse(req.body);
      const cart = await cartService.updateQuantity(
        userId!,
        parsed.productId,
        parsed.variantId,
        parsed.quantity
      );
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const parsed = removeItemBodySchema.parse(req.body);
      const cart = await cartService.removeItem(userId!, parsed.productId, parsed.variantId);
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      await cartService.clearCart(userId!);
      res.json({ success: true, data: { success: true } });
    } catch (error) {
      next(error);
    }
  }

  async mergeCart(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const parsed = mergeCartBodySchema.parse(req.body);

      // Extract sessionId from header or body for guest cart cleanup
      const sessionId =
        (req.headers['x-session-id'] as string | undefined) ??
        parsed.sessionId ??
        '';

      const cart = await cartService.mergeGuestCart(
        userId!,
        parsed.items,
        sessionId,
        parsed.couponCode
      );

      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async applyCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const parsed = applyCouponBodySchema.parse(req.body);

      // Get cart and compute subtotal server-side to run full validation
      const cart = await cartService.getOrCreateCart(userId!);
      const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const validationResult = await cartService.validateCoupon(parsed.code, subtotal);

      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          error: validationResult.errorMessage,
          errorReason: validationResult.errorReason,
        });
      }

      const updatedCart = await cartService.applyCoupon(userId!, parsed.code);
      res.json({ success: true, data: updatedCart });
    } catch (error) {
      next(error);
    }
  }

  async removeCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const cart = await cartService.removeCoupon(userId!);
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async validateCouponOnly(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const parsed = applyCouponBodySchema.parse(req.body);

      // Compute subtotal from the server cart
      const cart = await cartService.getOrCreateCart(userId!);
      const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const result = await cartService.validateCoupon(parsed.code, subtotal);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async validateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      const cart = await cartService.getOrCreateCart(userId!);
      const results = await cartService.validateStock(cart.items);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }
}

export const cartController = new CartController();
