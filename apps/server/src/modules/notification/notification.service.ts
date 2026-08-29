import { prisma } from '@repo/db';

interface CreateNotificationInput {
  type: string;
  level?: 'info' | 'success' | 'warning';
  title: string;
  body?: string;
  orderId?: string;
  productId?: string;
}

class NotificationService {
  /** Append a notification to the admin feed. Best-effort — callers swallow errors. */
  async create(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        type: data.type,
        level: data.level ?? 'info',
        title: data.title,
        body: data.body ?? null,
        orderId: data.orderId ?? null,
        productId: data.productId ?? null,
      },
    });
  }

  /** Most-recent notifications for the bell dropdown. */
  async list({ limit = 20, unreadOnly = false }: { limit?: number; unreadOnly?: boolean } = {}) {
    return prisma.notification.findMany({
      where: unreadOnly ? { read: false } : {},
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, limit)),
    });
  }

  async unreadCount(): Promise<number> {
    return prisma.notification.count({ where: { read: false } });
  }

  async markRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllRead(): Promise<number> {
    const res = await prisma.notification.updateMany({ where: { read: false }, data: { read: true } });
    return res.count;
  }
}

export const notificationService = new NotificationService();
