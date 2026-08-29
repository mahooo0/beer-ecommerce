import { OrderModel } from '@repo/db';
import { eventBus } from '../../common/events/event-bus.js';
import { analyticsService } from './analytics.service.js';

/**
 * Authoritative purchase tracking. When an order is created we read back its
 * `sessionId` / email and record a `purchased` analytics event server-side —
 * so the funnel's conversion signal never depends on the browser reaching the
 * success page. Best-effort: analytics failures must never affect checkout.
 */
export function registerAnalyticsEventListeners(): void {
  eventBus.on('order.created', (data) => {
    void (async () => {
      try {
        const order = await OrderModel.findById(data.orderId)
          .select('sessionId userId guestEmail totalAmount')
          .lean();
        if (!order) return;

        await analyticsService.recordPurchase({
          sessionId: order.sessionId ?? null,
          userId: order.userId ?? data.userId ?? null,
          orderId: data.orderId,
          valueCents: order.totalAmount ?? data.totalAmount ?? 0,
          email: order.guestEmail ?? null,
        });
      } catch (err) {
        console.error('[analytics] failed to record purchase:', err);
      }
    })();
  });
}
