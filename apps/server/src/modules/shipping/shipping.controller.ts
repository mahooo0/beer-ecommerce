import type { Request, Response, NextFunction } from 'express';
import { shippingService } from './shipping.service.js';

export class ShippingController {
  // Zone endpoints
  async createZone(req: Request, res: Response, next: NextFunction) {
    try {
      const zone = await shippingService.createZone(req.body);
      res.status(201).json({ success: true, data: zone });
    } catch (error) {
      next(error);
    }
  }

  async getAllZones(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const zones = await shippingService.getAllZones(includeInactive);
      res.json({ success: true, data: zones });
    } catch (error) {
      next(error);
    }
  }

  async getZoneById(req: Request, res: Response, next: NextFunction) {
    try {
      const zone = await shippingService.getZoneById(req.params.id as string);
      res.json({ success: true, data: zone });
    } catch (error) {
      next(error);
    }
  }

  async updateZone(req: Request, res: Response, next: NextFunction) {
    try {
      const zone = await shippingService.updateZone(req.params.id as string, req.body);
      res.json({ success: true, data: zone });
    } catch (error) {
      next(error);
    }
  }

  async deleteZone(req: Request, res: Response, next: NextFunction) {
    try {
      await shippingService.deleteZone(req.params.id as string);
      res.json({ success: true, message: 'Zone deleted' });
    } catch (error) {
      next(error);
    }
  }

  // Method endpoints
  async createMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const method = await shippingService.createMethod(req.body);
      res.status(201).json({ success: true, data: method });
    } catch (error) {
      next(error);
    }
  }

  async getMethodsByZone(req: Request, res: Response, next: NextFunction) {
    try {
      const methods = await shippingService.getMethodsByZone(req.params.zoneId as string);
      res.json({ success: true, data: methods });
    } catch (error) {
      next(error);
    }
  }

  async updateMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const method = await shippingService.updateMethod(req.params.id as string, req.body);
      res.json({ success: true, data: method });
    } catch (error) {
      next(error);
    }
  }

  async deleteMethod(req: Request, res: Response, next: NextFunction) {
    try {
      await shippingService.deleteMethod(req.params.id as string);
      res.json({ success: true, message: 'Method deleted' });
    } catch (error) {
      next(error);
    }
  }

  // Rate calculation endpoint (public - for checkout)
  async getAvailableShippingMethods(req: Request, res: Response, next: NextFunction) {
    try {
      const { country, state, cartSubtotal, cartWeight } = req.body;
      const result = await shippingService.getAvailableShippingMethods({
        country,
        state,
        cartSubtotal,
        cartWeight,
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'No shipping available to this location',
        });
      }

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const shippingController = new ShippingController();
