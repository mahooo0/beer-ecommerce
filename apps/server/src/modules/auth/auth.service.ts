import { prisma } from '@repo/db';
import { AppError } from '../../common/middleware/error-handler.js';

export class AuthService {
  async syncUser(data: {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    role?: string;
  }) {
    return prisma.user.upsert({
      where: { clerkId: data.clerkId },
      update: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
        phone: data.phone,
        role: data.role as any, // Role enum from Prisma schema
      },
      create: {
        clerkId: data.clerkId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
        phone: data.phone,
        role: (data.role as any) || 'CUSTOMER', // Default to CUSTOMER if not provided
      },
    });
  }

  async deleteUser(clerkId: string) {
    // Soft delete by setting isActive to false to preserve order history
    return prisma.user.update({
      where: { clerkId },
      data: { isActive: false },
    });
  }

  async getUserByClerkId(clerkId: string) {
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new AppError(404, 'User not found');
    return user;
  }

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.user.count(),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const authService = new AuthService();
