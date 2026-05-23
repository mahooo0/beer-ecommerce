'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCartStore } from '@/stores/cart-store';
import { api } from '@/lib/api';
import { CartItemRow } from '@/components/cart/cart-item-row';
import { CouponSection } from '@/components/cart/coupon-section';
import { PriceSummary } from '@/components/cart/price-summary';
import { StockWarning } from '@/components/cart/stock-warning';

interface StockValidationResult {
  productId: string;
  variantId?: string;
  requestedQty: number;
  availableQty: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export function CartPageClient() {
  const { isSignedIn, getToken } = useAuth();

  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const discountAmount = useCartStore((s) => s.discountAmount);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const subtotal = useCartStore((s) => s.subtotal);

  const [mounted, setMounted] = useState(false);
  const [stockResults, setStockResults] = useState<StockValidationResult[]>([]);
  const [stockLoading, setStockLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isSignedIn || items.length === 0) return;

    const validateStock = async () => {
      setStockLoading(true);
      try {
        const token = await getToken();
        if (!token) return;
        const res = await api.cart.validateStock(token) as {
          success: boolean;
          data?: StockValidationResult[];
        };
        if (res.success && Array.isArray(res.data)) {
          setStockResults(res.data);
        }
      } catch {
        // Silently fail — stock validation is advisory
      } finally {
        setStockLoading(false);
      }
    };

    void validateStock();
  }, [mounted, isSignedIn, items]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStockResult = (productId: string, variantId?: string) => {
    return stockResults.find(
      (r) => r.productId === productId && r.variantId === variantId,
    );
  };

  const hasOutOfStockItems = stockResults.some((r) => r.status === 'out_of_stock');

  const handleUpdateQuantity = async (
    productId: string,
    variantId: string | undefined,
    quantity: number,
  ) => {
    updateQuantity(productId, variantId ?? '', quantity);

    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          void api.cart.updateQuantity(productId, variantId, quantity, token);
        }
      } catch {
        // Fire-and-forget
      }
    }
  };

  const handleRemoveItem = async (productId: string, variantId: string | undefined) => {
    removeItem(productId, variantId ?? '');

    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          void api.cart.removeItem(productId, variantId, token);
        }
      } catch {
        // Fire-and-forget
      }
    }
  };

  const handleClearCart = async () => {
    clearCart();

    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          void api.cart.clear(token);
        }
      } catch {
        // Fire-and-forget
      }
    }
  };

  if (!mounted) {
    return (
      <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse bg-neutral-100" />
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse bg-neutral-50" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-container px-4 py-24 text-center sm:px-6 lg:px-8">
        <svg className="mx-auto size-20 text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h1 className="mt-6 text-display-xs font-light text-neutral-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-neutral-500">Add some items to get started.</p>
        <Link
          href="/"
          className="mt-8 inline-block bg-neutral-900 px-8 py-3 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-neutral-800"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-8">
      {/* Page heading */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase">Your</p>
          <h1 className="mt-1 text-display-xs font-light text-neutral-900">
            Shopping Cart
            <span className="ml-2 text-lg text-neutral-400">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </h1>
        </div>
        <button
          onClick={() => void handleClearCart()}
          className="text-xs font-medium tracking-wider text-neutral-500 uppercase transition hover:text-neutral-900"
        >
          Clear Cart
        </button>
      </div>

      <div className="h-px bg-neutral-200 mb-8" />

      <div className="lg:grid lg:grid-cols-3 lg:gap-12">
        {/* Item list */}
        <div className="lg:col-span-2" data-tour="cart-items">
          <div className="divide-y divide-neutral-100">
            {items.map((item) => {
              const stockResult = getStockResult(item.productId, item.variantId);
              return (
                <div key={`${item.productId}-${item.variantId ?? 'no-variant'}`}>
                  <CartItemRow
                    item={item}
                    onUpdateQuantity={(qty) =>
                      void handleUpdateQuantity(item.productId, item.variantId, qty)
                    }
                    onRemove={() =>
                      void handleRemoveItem(item.productId, item.variantId)
                    }
                  />
                  {stockResult && !stockLoading && (
                    <div className="pb-3">
                      <StockWarning
                        status={stockResult.status}
                        availableQty={stockResult.availableQty}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order summary */}
        <div className="mt-8 lg:mt-0">
          <div data-tour="order-summary" className="sticky top-20 border border-neutral-200 p-6 space-y-4">
            <h2 className="text-xs font-semibold tracking-[0.2em] text-neutral-900 uppercase">Order Summary</h2>

            <div className="border-b border-neutral-100 pb-1">
              <CouponSection
                onCouponApplied={(code, discount) => applyCoupon(code, discount)}
                onCouponRemoved={() => removeCoupon()}
                currentCode={couponCode}
                discountAmount={discountAmount}
              />
            </div>

            <PriceSummary
              subtotal={subtotal()}
              discountAmount={discountAmount}
              couponCode={couponCode}
            />

            <div className="pt-2 space-y-3">
              {hasOutOfStockItems ? (
                <div>
                  <button
                    disabled
                    className="w-full bg-neutral-200 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase cursor-not-allowed"
                  >
                    Proceed to Checkout
                  </button>
                  <p className="mt-2 text-center text-xs text-red-600">
                    Remove out-of-stock items to continue
                  </p>
                </div>
              ) : (
                <Link
                  data-tour="checkout-btn"
                  href="/checkout"
                  className="block w-full bg-neutral-900 py-3.5 text-center text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-neutral-800"
                >
                  Proceed to Checkout
                </Link>
              )}

              <Link
                href="/"
                className="block w-full py-2 text-center text-xs font-medium tracking-wider text-neutral-500 uppercase transition hover:text-neutral-900"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
