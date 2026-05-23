'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { useCheckoutStore } from '@/stores/checkout-store';
import { AddressStep } from './steps/address-step';
import { ShippingStep } from './steps/shipping-step';
import { PaymentStep } from './steps/payment-step';

const steps = ['Address', 'Shipping', 'Payment'];

export function CheckoutPageClient() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const couponCode = useCartStore((s) => s.couponCode);
  const discountAmount = useCartStore((s) => s.discountAmount);

  const step = useCheckoutStore((s) => s.step);
  const shippingMethod = useCheckoutStore((s) => s.shippingMethod);
  const reset = useCheckoutStore((s) => s.reset);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      // Don't reset on unmount — user might navigate back
    };
  }, []);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse bg-neutral-100" />
      </div>
    );
  }

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  const shippingCost = shippingMethod?.cost ?? 0;
  const taxAmount = Math.round(subtotal() * 0.08);
  const total = subtotal() + shippingCost + taxAmount - discountAmount;

  return (
    <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase">Secure</p>
        <h1 className="mt-1 text-display-xs font-light text-neutral-900">Checkout</h1>
      </div>

      {/* Step indicator */}
      <div className="mb-10 flex items-center gap-2">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 ${isCompleted ? 'bg-neutral-900' : 'bg-neutral-200'}`} />}
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-neutral-900 text-white'
                      : isCompleted
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {isCompleted ? '✓' : stepNum}
                </span>
                <span className={`text-xs font-medium tracking-wider uppercase ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-12">
        {/* Main content */}
        <div className="lg:col-span-2">
          {step === 1 && <AddressStep />}
          {step === 2 && <ShippingStep />}
          {step === 3 && <PaymentStep />}
        </div>

        {/* Order summary sidebar */}
        <div className="mt-8 lg:mt-0">
          <div className="sticky top-20 border border-neutral-200 p-6 space-y-4">
            <h2 className="text-xs font-semibold tracking-[0.2em] text-neutral-900 uppercase">
              Order Summary
            </h2>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId ?? ''}`} className="flex justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-neutral-700">{item.name}</p>
                    <p className="text-neutral-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="ml-4 text-neutral-900">${((item.price * item.quantity) / 100).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span>${(subtotal() / 100).toFixed(2)}</span>
              </div>
              {shippingMethod && (
                <div className="flex justify-between text-neutral-500">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? 'Free' : `$${(shippingCost / 100).toFixed(2)}`}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-500">
                <span>Tax</span>
                <span>${(taxAmount / 100).toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount{couponCode ? ` (${couponCode})` : ''}</span>
                  <span>-${(discountAmount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-neutral-200 pt-2 flex justify-between font-semibold text-neutral-900">
                <span>Total</span>
                <span>${(total / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
