import type { Request, Response, NextFunction } from 'express';
import { orderService } from './order.service.js';

export class OrderController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.getAll({
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        status: req.query.status as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        minAmount: req.query.minAmount ? parseInt(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseInt(req.query.maxAmount as string) : undefined,
        search: req.query.search as string,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getByUserId(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.getByUserId(req.params.userId as string, {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        status: req.query.status as string,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getById(req.params.id as string);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.create(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.updateStatus(req.params.id as string, req.body.status);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async addTracking(req: Request, res: Response, next: NextFunction) {
    try {
      const { carrier, trackingNumber, estimatedDelivery } = req.body;

      if (!carrier || !trackingNumber) {
        return res.status(400).json({
          success: false,
          error: 'Carrier and tracking number are required',
        });
      }

      const order = await orderService.addTracking(req.params.id as string, {
        carrier,
        trackingNumber,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
      });

      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await orderService.getOrderStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount } = req.body;
      const refund = await orderService.processRefund(req.params.id as string, amount);
      res.json({ success: true, data: refund });
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
