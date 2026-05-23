'use client';

import { formatPrice } from '@/lib/utils';

interface PriceSummaryProps {
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
}

export function PriceSummary({ subtotal, discountAmount, couponCode }: PriceSummaryProps) {
  const total = subtotal - discountAmount;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-tertiary">Subtotal</span>
        <span className="font-medium text-primary">{formatPrice(subtotal)}</span>
      </div>

      {couponCode && discountAmount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-utility-success-700">Discount ({couponCode})</span>
          <div className="text-right">
            <span className="font-medium text-utility-success-700">-{formatPrice(discountAmount)}</span>
          </div>
        </div>
      )}

      {couponCode && discountAmount > 0 && (
        <div className="text-xs text-utility-success-700 text-right">
          You save {formatPrice(discountAmount)}
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-tertiary">Shipping</span>
        <span className="text-quaternary italic">Calculated at checkout</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-tertiary">Tax</span>
        <span className="text-quaternary italic">Calculated at checkout</span>
      </div>

      <div className="border-t border-border-secondary pt-3">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-primary">Total</span>
          <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
