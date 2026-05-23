import type { Request, Response, NextFunction } from 'express';
import { Webhook } from 'svix';
import { getAuth } from '@clerk/express';
import { authService } from './auth.service.js';
import { config } from '../../config/index.js';
import { AppError } from '../../common/middleware/error-handler.js';

export class AuthController {
  async syncUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.syncUser(req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Get raw body (Buffer) and Svix headers
      const body = req.body as Buffer;
      const svixId = req.headers['svix-id'] as string;
      const svixTimestamp = req.headers['svix-timestamp'] as string;
      const svixSignature = req.headers['svix-signature'] as string;

      if (!svixId || !svixTimestamp || !svixSignature) {
        throw new AppError(400, 'Missing Svix headers');
      }

      // Verify webhook signature
      const webhook = new Webhook(config.clerkWebhookSecret);
      let event: any;

      try {
        event = webhook.verify(body.toString(), {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        });
      } catch (error) {
        throw new AppError(400, 'Invalid webhook signature');
      }

      // Handle different event types
      const eventType = event.type;
      const userData = event.data;

      switch (eventType) {
        case 'user.created':
        case 'user.updated': {
          // Extract user data from Clerk webhook payload
          const email = userData.email_addresses?.[0]?.email_address;
          const firstName = userData.first_name || '';
          const lastName = userData.last_name || '';
          const avatar = userData.image_url;
          const phone = userData.phone_numbers?.[0]?.phone_number;
          const role = userData.public_metadata?.role;

          if (!email) {
            throw new AppError(400, 'Email is required');
          }

          await authService.syncUser({
            clerkId: userData.id,
            email,
            firstName,
            lastName,
            avatar,
            phone,
            role,
          });

          break;
        }

        case 'user.deleted': {
          if (userData.id) {
            await authService.deleteUser(userData.id);
          }
          break;
        }

        default:
          console.log(`Unhandled webhook event type: ${eventType}`);
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const user = await authService.getUserByClerkId(userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await authService.getAllUsers(page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
