'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore } from '@/stores/cart-store';
import { useCheckoutStore } from '@/stores/checkout-store';
import { api } from '@/lib/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const orderId = useCheckoutStore((s) => s.orderId);
  const setIsProcessing = useCheckoutStore((s) => s.setIsProcessing);
  const isProcessing = useCheckoutStore((s) => s.isProcessing);
  const reset = useCheckoutStore((s) => s.reset);

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError('');

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Payment validation failed');
      setIsProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation?orderId=${orderId}`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setIsProcessing(false);
    }
    // If successful, Stripe redirects to return_url
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-neutral-900 py-3.5 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export function PaymentStep() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const couponCode = useCartStore((s) => s.couponCode);
  const discountAmount = useCartStore((s) => s.discountAmount);

  const shippingAddress = useCheckoutStore((s) => s.shippingAddress);
  const billingAddress = useCheckoutStore((s) => s.billingAddress);
  const billingSameAsShipping = useCheckoutStore((s) => s.billingSameAsShipping);
  const shippingMethod = useCheckoutStore((s) => s.shippingMethod);
  const paymentIntentClientSecret = useCheckoutStore((s) => s.paymentIntentClientSecret);
  const setPaymentIntent = useCheckoutStore((s) => s.setPaymentIntent);
  const setStep = useCheckoutStore((s) => s.setStep);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const shippingCost = shippingMethod?.cost ?? 0;
  const taxAmount = Math.round(subtotal() * 0.08);
  const totalAmount = subtotal() + shippingCost + taxAmount - discountAmount;

  useEffect(() => {
    async function createOrderAndPayment() {
      if (paymentIntentClientSecret) {
        setLoading(false);
        return;
      }

      try {
        const token = await getToken();
        if (!token || !shippingAddress) return;

        // 1. Create the order (pending)
        const orderRes = await api.orders.create(
          {
            userId: user?.id || '',
            items: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              name: item.name,
              sku: item.sku,
              price: item.price,
              quantity: item.quantity,
              imageUrl: item.imageUrl,
              attributes: item.attributes || {},
            })),
            shippingAddress,
            billingAddress: billingSameAsShipping ? shippingAddress : billingAddress || shippingAddress,
            subtotal: subtotal(),
            taxAmount,
            shippingCost,
            discountAmount,
            totalAmount,
            couponCode: couponCode || undefined,
            shipping: shippingMethod
              ? { method: shippingMethod.name, cost: shippingCost }
              : undefined,
            payment: {
              provider: 'stripe',
              paymentIntentId: '',
              status: 'pending',
              amount: totalAmount,
              refundedAmount: 0,
            },
          } as any,
          token,
        );

        if (!orderRes.success || !orderRes.data) {
          throw new Error('Failed to create order');
        }

        const orderId = (orderRes.data as any)._id || orderRes.data.id;

        // 2. Create payment intent
        const paymentRes = await api.payments.createIntent(
          { amount: totalAmount, orderId },
          token,
        );

        if (!paymentRes.success || !paymentRes.data) {
          throw new Error('Failed to create payment');
        }

        setPaymentIntent(paymentRes.data.clientSecret, orderId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    }

    createOrderAndPayment();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-900">Payment</h2>
        <div className="h-48 animate-pulse bg-neutral-50 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-900">Payment</h2>
        <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
        <button
          onClick={() => setStep(2)}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-900">Payment</h2>
        <button
          onClick={() => setStep(2)}
          className="text-xs font-medium tracking-wider text-neutral-500 uppercase hover:text-neutral-900"
        >
          Edit Shipping
        </button>
      </div>

      {paymentIntentClientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: paymentIntentClientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#171717',
                borderRadius: '0px',
              },
            },
          }}
        >
          <PaymentForm />
        </Elements>
      )}
    </div>
  );
}
