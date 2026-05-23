import { OrderModel } from '@repo/db';
import { eventBus } from '../../common/events/event-bus.js';

eventBus.on('payment.completed', async (data) => {
  try {
    await OrderModel.findByIdAndUpdate(data.orderId, {
      $set: {
        status: 'paid',
        'payment.status': 'succeeded',
        'payment.paidAt': new Date(),
        'payment.paymentIntentId': data.paymentIntentId,
      },
      $push: {
        statusHistory: {
          from: 'pending',
          to: 'paid',
          changedAt: new Date(),
          note: 'Payment confirmed via Stripe webhook',
        },
      },
    });
    console.log(`[Payment] Order ${data.orderId} marked as paid`);
  } catch (err) {
    console.error(`[Payment] Failed to update order ${data.orderId}:`, err);
  }
});

eventBus.on('payment.failed', async (data) => {
  try {
    await OrderModel.findByIdAndUpdate(data.orderId, {
      $set: {
        'payment.status': 'failed',
      },
    });
    console.log(`[Payment] Order ${data.orderId} payment failed: ${data.error}`);
  } catch (err) {
    console.error(`[Payment] Failed to update order ${data.orderId}:`, err);
  }
});
