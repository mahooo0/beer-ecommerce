import type { CartItem } from '@repo/types';

// ============================================================================
// CART ITEM FIXTURES
// ============================================================================

export const mockCartItem: CartItem = {
  productId: 'prod-1',
  variantId: 'var-1',
  name: 'Test Product',
  price: 1999,
  quantity: 2,
  imageUrl: 'https://example.com/img.jpg',
  sku: 'TEST-001',
  attributes: { size: 'M', color: 'Red' },
};

export const mockCartItemNoVariant: CartItem = {
  productId: 'prod-1',
  variantId: undefined,
  name: 'Test Product',
  price: 1999,
  quantity: 2,
  imageUrl: 'https://example.com/img.jpg',
  sku: 'TEST-001',
  attributes: { size: 'M', color: 'Red' },
};

// ============================================================================
// COUPON FIXTURES (Prisma shape)
// ============================================================================

export const mockCoupon = {
  id: 'coupon-1',
  code: 'SAVE20',
  discountType: 'PERCENTAGE',
  discountValue: 20,
  minOrderAmount: 5000,
  maxDiscountAmount: 2000,
  usageLimit: 100,
  usageCount: 5,
  perCustomerLimit: 1,
  applicableProductIds: [],
  applicableCategoryIds: [],
  startsAt: new Date('2024-01-01'),
  expiresAt: new Date('2030-12-31'),
  isActive: true,
};

export const mockExpiredCoupon = {
  ...mockCoupon,
  id: 'coupon-expired',
  code: 'EXPIRED20',
  expiresAt: new Date('2024-01-01'),
  isActive: true,
};

export const mockInactiveCoupon = {
  ...mockCoupon,
  id: 'coupon-inactive',
  code: 'INACTIVE20',
  isActive: false,
};

export const mockFixedCoupon = {
  ...mockCoupon,
  id: 'coupon-fixed',
  code: 'SAVE5',
  discountType: 'FIXED_AMOUNT',
  discountValue: 500,
};

export const mockFreeShippingCoupon = {
  ...mockCoupon,
  id: 'coupon-freeship',
  code: 'FREESHIP',
  discountType: 'FREE_SHIPPING',
  discountValue: 0,
};

// ============================================================================
// CART FIXTURES (MongoDB shape)
// ============================================================================

export const mockCart = {
  _id: 'cart-1',
  userId: 'user-1',
  items: [mockCartItem],
  couponCode: null,
  expiresAt: null,
};

export const mockGuestCart = {
  _id: 'cart-2',
  sessionId: 'session-abc',
  items: [mockCartItem],
  couponCode: null,
  expiresAt: new Date('2024-06-01'),
};
