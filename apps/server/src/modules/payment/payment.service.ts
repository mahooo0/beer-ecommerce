import Stripe from 'stripe';
import { config } from '../../config/index.js';
import { eventBus } from '../../common/events/event-bus.js';

const stripe = new Stripe(config.stripeSecretKey);

export class PaymentService {
  async createPaymentIntent(data: { amount: number; orderId: string }) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: 'usd',
      metadata: { orderId: data.orderId },
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
