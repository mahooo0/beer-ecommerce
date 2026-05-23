'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';

interface CouponSectionProps {
  onCouponApplied: (code: string, discount: number) => void;
  onCouponRemoved: () => void;
  currentCode: string | null;
  discountAmount: number;
}

export function CouponSection({
  onCouponApplied,
  onCouponRemoved,
  currentCode,
}: CouponSectionProps) {
  const { getToken, isSignedIn } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!inputValue.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignedIn) {
        const token = await getToken();
        if (!token) {
          setError('Authentication required');
          return;
        }

        const res = await api.cart.applyCoupon(inputValue.trim(), token) as {
          success: boolean;
          data?: { discountAmount?: number; errorMessage?: string };
          error?: string;
        };

        if (res.success && res.data) {
          onCouponApplied(inputValue.trim(), res.data.discountAmount ?? 0);
          setInputValue('');
          setExpanded(false);
        } else {
          setError(res.data?.errorMessage ?? res.error ?? 'Invalid coupon code');
        }
      } else {
        // Guest: validate only, update local store
        const res = await api.cart.validateCoupon(inputValue.trim(), '') as {
          success: boolean;
          data?: { valid?: boolean; discountAmount?: number; errorMessage?: string };
          error?: string;
        };

        if (res.success && res.data?.valid) {
          onCouponApplied(inputValue.trim(), res.data.discountAmount ?? 0);
          setInputValue('');
          setExpanded(false);
        } else {
          setError(res.data?.errorMessage ?? 'Invalid coupon code');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply coupon';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void handleApply();
    }
  };

  if (currentCode) {
    return (
      <div className="py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-tertiary">Promo code:</span>
          <span className="inline-flex items-center gap-1 bg-utility-success-50 text-utility-success-700 text-sm font-medium px-3 py-1 rounded-full">
            {currentCode}
            <button
              onClick={onCouponRemoved}
              className="ml-1 text-utility-success-700 hover:text-utility-success-700 transition-colors"
              aria-label="Remove coupon"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="text-sm text-tertiary hover:text-primary underline transition-colors"
        >
          Have a promo code?
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter promo code"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand ${
                  error
                    ? 'border-error-primary focus:ring-error-primary'
                    : 'border-border-primary'
                }`}
                disabled={loading}
                autoFocus
              />
              {error && (
                <p className="mt-1 text-xs text-error-primary">{error}</p>
              )}
            </div>
            <button
              onClick={() => void handleApply()}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-primary-solid text-white rounded-lg hover:bg-primary-solid_hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Applying...' : 'Apply'}
            </button>
          </div>
          <button
            onClick={() => {
              setExpanded(false);
              setInputValue('');
              setError(null);
            }}
            className="text-xs text-tertiary hover:text-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
