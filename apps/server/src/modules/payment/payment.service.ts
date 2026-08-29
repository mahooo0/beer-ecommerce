import Stripe from 'stripe';
import { OrderModel } from '@repo/db';
import { config } from '../../config/index.js';
import { eventBus } from '../../common/events/event-bus.js';
import { AppError } from '../../common/middleware/error-handler.js';

const stripe = new Stripe(config.stripeSecretKey);

export class PaymentService {
  /**
   * Create a Stripe payment intent for an order. The charge amount is read from
   * the (server-computed) order total — never from the client — so a tampered
   * client amount cannot change what the customer is charged.
   */
  async createPaymentIntent(data: { orderId: string }) {
    const order = await OrderModel.findById(data.orderId);
    if (!order) throw new AppError(404, 'Order not found');

    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.totalAmount,
      currency: 'pln',
      // Let Stripe surface every method enabled on the account (card, BLIK, …).
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: data.orderId },
    });

    // Record the intent id on the order so refunds work even before the webhook.
    await OrderModel.findByIdAndUpdate(data.orderId, {
      'payment.paymentIntentId': paymentIntent.id,
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripeWebhookSecret,
    );

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata.orderId;
        if (orderId) {
          eventBus.emit('payment.completed', {
            orderId,
            paymentIntentId: pi.id,
          });
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata.orderId;
        if (orderId) {
          eventBus.emit('payment.failed', {
            orderId,
            error: pi.last_payment_error?.message || 'Payment failed',
          });
        }
        break;
      }
    }
  }

  async createRefund(paymentIntentId: string, amount?: number) {
    const params: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };
    if (amount) {
      params.amount = amount;
    }
    const refund = await stripe.refunds.create(params);
    return {
      id: refund.id,
      amount: refund.amount,
      status: refund.status,
    };
  }

  async getPaymentIntent(id: string) {
    const pi = await stripe.paymentIntents.retrieve(id);
    return {
      id: pi.id,
      amount: pi.amount,
      status: pi.status,
      metadata: pi.metadata,
    };
  }
}

export const paymentService = new PaymentService();
