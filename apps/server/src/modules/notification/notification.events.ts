import { OrderModel, prisma } from '@repo/db';
import { eventBus } from '../../common/events/event-bus.js';
import { notificationService } from './notification.service.js';

const zl = (cents: number) => `${(cents / 100).toFixed(2)} zł`;

/**
 * Turn domain events into admin bell notifications. `title` holds the entity
 * (order number / product name) and `body` the details — the admin client
 * localizes the "kind" label from `type`, so this text stays language-neutral.
 * Best-effort: notification failures never affect the originating flow.
 */
export function registerNotificationEventListeners(): void {
  eventBus.on('order.created', (data) => {
    void (async () => {
      try {
        const order = await OrderModel.findById(data.orderId).select('orderNumber totalAmount').lean();
        await notificationService.create({
          type: 'order.created',
          level: 'success',
          title: order?.orderNumber ?? data.orderId,
          body: order ? zl(order.totalAmount) : undefined,
          orderId: data.orderId,
        });
      } catch (err) {
        console.error('[notification] order.created failed:', err);
      }
    })();
  });

  eventBus.on('order.shipped', (data) => {
    void (async () => {
      try {
        const order = await OrderModel.findById(data.orderId).select('orderNumber').lean();
        const parts = [data.carrier, data.trackingNumber].filter(Boolean);
        await notificationService.create({
          type: 'order.shipped',
          level: 'info',
          title: order?.orderNumber ?? data.orderId,
          body: parts.length ? parts.join(' · ') : undefined,
          orderId: data.orderId,
        });
      } catch (err) {
        console.error('[notification] order.shipped failed:', err);
      }
    })();
  });

  eventBus.on('inventory.lowStock', (data) => {
    void (async () => {
      try {
        let productId: string | undefined;
        let name = data.variantId;
        try {
          const variant = await prisma.productVariant.findUnique({
            where: { id: data.variantId },
            select: { productId: true, product: { select: { name: true } } },
          });
          if (variant) {
            productId = variant.productId;
            name = variant.product?.name ?? name;
          }
        } catch {
          // best-effort name resolution
        }
        await notificationService.create({
          type: 'inventory.lowStock',
          level: 'warning',
          title: name,
          body: `${data.available} / ${data.threshold}`,
          productId,
        });
      } catch (err) {
        console.error('[notification] inventory.lowStock failed:', err);
      }
    })();
  });
}
