import type { Request, Response, NextFunction } from 'express';
import { requireAuth as clerkRequireAuth, getAuth, clerkClient } from '@clerk/express';
import { AppError } from './error-handler.js';

// Re-export Clerk's requireAuth middleware
export const requireAuth = clerkRequireAuth();

// Custom middleware to check for admin role
// TODO: Re-enable role check once Clerk publicMetadata.role is configured
export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    const { userId } = getAuth(req);
    if (!userId) throw new AppError(401, 'Unauthorized');

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(401, 'Authentication failed'));
    }
  }
}

// Factory function to create role-specific middleware
export function requireRole(role: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) throw new AppError(401, 'Unauthorized');

      const user = await clerkClient.users.getUser(userId);
      const userRole = user.publicMetadata?.role as string | undefined;

      if (userRole !== role) {
        throw new AppError(403, `${role} access required`);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) next(error);
      else next(new AppError(401, 'Authentication failed'));
    }
  };
}
