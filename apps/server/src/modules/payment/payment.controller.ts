import type { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service.js';
import { AppError } from '../../common/middleware/error-handler.js';

export class PaymentController {
  async createPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, orderId } = req.body;
      if (!amount || !orderId) {
        throw new AppError(400, 'amount and orderId are required');
      }
      const result = await paymentService.createPaymentIntent({ amount, orderId });
      res.json({
        success: true,
        data: { clientSecret: result.clientSecret, paymentIntentId: result.id },
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      if (!signature) {
        throw new AppError(400, 'Missing stripe-signature header');
      }
      await paymentService.handleWebhook(req.body, signature);
      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }

  async createRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentIntentId, amount } = req.body;
      if (!paymentIntentId) {
        throw new AppError(400, 'paymentIntentId is required');
      }
      const refund = await paymentService.createRefund(paymentIntentId, amount);
      res.json({ success: true, data: refund });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.getPaymentIntent(req.params.paymentIntentId as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
