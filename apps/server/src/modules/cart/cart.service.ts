import { prisma, CartModel, type ICart, type ICartItem } from '@repo/db';
import { eventBus } from '../../common/events/event-bus.js';
import { AppError } from '../../common/middleware/error-handler.js';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CouponValidationResult {
  valid: boolean;
  coupon?: any;
  discountAmount?: number; // cents
  errorReason?: 'INVALID_CODE' | 'CODE_EXPIRED' | 'MINIMUM_ORDER' | 'USAGE_LIMIT' | 'NOT_STARTED';
  errorMessage?: string;
}

export interface StockValidationResult {
  productId: string;
  variantId?: string;
  sku: string;
  requestedQty: number;
  availableQty: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function computeDiscount(
  coupon: {
    discountType: string;
    discountValue: number;
    maxDiscountAmount: number | null;
  },
  subtotal: number
): number {
  if (coupon.discountType === 'PERCENTAGE') {
    const raw = Math.floor((subtotal * coupon.discountValue) / 100);
    return coupon.maxDiscountAmount !== null ? Math.min(raw, coupon.maxDiscountAmount) : raw;
  } else if (coupon.discountType === 'FIXED_AMOUNT') {
    return Math.min(coupon.discountValue, subtotal);
  } else {
    // FREE_SHIPPING — discount on shipping; discount amount 0 for subtotal purposes
    return 0;
  }
}

// ============================================================================
// CART SERVICE
// ============================================================================

export class CartService {
  // -------------------------------------------------------------------------
  // Cart retrieval
  // -------------------------------------------------------------------------

  async getOrCreateCart(userId: string): Promise<ICart> {
    const existing = await CartModel.findOne({ userId });
    if (existing) return existing;

    return CartModel.create({ userId, items: [] });
  }

  async getGuestCart(sessionId: string): Promise<ICart | null> {
    return CartModel.findOne({ sessionId });
  }

  // -------------------------------------------------------------------------
  // CRUD operations
  // -------------------------------------------------------------------------

  async addItem(userId: string, item: ICartItem): Promise<ICart> {
    const cart = await this.getOrCreateCart(userId);

    const existingIndex = cart.items.findIndex(
      (i) => i.productId === item.productId && i.variantId === item.variantId
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex]!.quantity += item.quantity;
    } else {
      cart.items.push(item);
    }

    await cart.save();

    eventBus.emit('cart.updated', {
      cartId: String(cart._id),
      userId,
      itemCount: cart.items.length,
    });

    return cart;
  }

  async updateQuantity(
    userId: string,
    productId: string,
    variantId: string | undefined,
    quantity: number
  ): Promise<ICart> {
    const cart = await this.getOrCreateCart(userId);

    const item = cart.items.find(
      (i) => i.productId === productId && i.variantId === variantId
    );

    if (!item) {
      throw new AppError(404, 'Cart item not found');
    }

    item.quantity = quantity;
    await cart.save();

    eventBus.emit('cart.updated', {
      cartId: String(cart._id),
      userId,
      itemCount: cart.items.length,
    });

    return cart;
  }

  async removeItem(
    userId: string,
    productId: string,
    variantId: string | undefined
  ): Promise<ICart> {
    const cart = await this.getOrCreateCart(userId);

    cart.items = cart.items.filter(
      (i) => !(i.productId === productId && i.variantId === variantId)
    ) as typeof cart.items;

    await cart.save();

    eventBus.emit('cart.updated', {
      cartId: String(cart._id),
      userId,
      itemCount: cart.items.length,
    });

    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);

    cart.items = [] as typeof cart.items;
    cart.couponCode = undefined;
    await cart.save();

    eventBus.emit('cart.updated', {
      cartId: String(cart._id),
      userId,
      itemCount: 0,
    });
  }

  // -------------------------------------------------------------------------
  // Guest cart merge
  // -------------------------------------------------------------------------

  async mergeGuestCart(
    userId: string,
    guestItems: ICartItem[],
    guestSessionId: string,
    couponCode?: string | null
  ): Promise<ICart> {
    const cart = await this.getOrCreateCart(userId);

    for (const guestItem of guestItems) {
      // Query total available stock for this item across all warehouses
      let availableQty = 0;
      try {
        const inventoryItems = await prisma.inventoryItem.findMany({
          where: guestItem.variantId
            ? { variantId: guestItem.variantId }
            : {
                variant: {
                  sku: guestItem.sku,
                },
              },
        });
        availableQty = inventoryItems.reduce(
          (sum, inv) => sum + Math.max(0, inv.quantity - inv.reserved),
          0
        );
      } catch {
        // If inventory check fails, treat as 0 available — skip item
        availableQty = 0;
      }

      if (availableQty <= 0) {
        continue; // Skip out-of-stock items during merge
      }

      const matchIndex = cart.items.findIndex(
        (i) => i.productId === guestItem.productId && i.variantId === guestItem.variantId
      );

      if (matchIndex >= 0) {
        const authItem = cart.items[matchIndex]!;
        authItem.quantity = Math.min(authItem.quantity + guestItem.quantity, availableQty);
      } else {
        const cappedQty = Math.min(guestItem.quantity, availableQty);
        if (cappedQty > 0) {
          cart.items.push({ ...guestItem, quantity: cappedQty });
        }
      }
    }

    // Apply coupon from guest cart if auth cart has none
    if (couponCode && !cart.couponCode) {
      cart.couponCode = couponCode;
    }

    await cart.save();

    // Delete guest cart document after successful merge
    try {
      await CartModel.deleteOne({ sessionId: guestSessionId });
    } catch {
      // Non-fatal: guest cart cleanup failure does not fail the merge
    }

    eventBus.emit('cart.updated', {
      cartId: String(cart._id),
      userId,
      itemCount: cart.items.length,
    });

    return cart;
  }

  // -------------------------------------------------------------------------
  // Coupon validation and application
  // -------------------------------------------------------------------------

  async validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return { valid: false, errorReason: 'INVALID_CODE', errorMessage: 'Invalid code' };
    }

    const now = new Date();

    if (now < coupon.startsAt) {
      return { valid: false, errorReason: 'NOT_STARTED', errorMessage: 'Invalid code' };
    }

    if (coupon.expiresAt && now > coupon.expiresAt) {
      return { valid: false, errorReason: 'CODE_EXPIRED', errorMessage: 'Code expired' };
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return {
        valid: false,
        errorReason: 'USAGE_LIMIT',
        errorMessage: 'Code no longer available',
      };
    }

    if (coupon.minOrderAmount !== null && subtotal < coupon.minOrderAmount) {
      const minFormatted = formatCents(coupon.minOrderAmount);
      return {
        valid: false,
        errorReason: 'MINIMUM_ORDER',
        errorMessage: `Minimum order ${minFormatted} required`,
      };
    }

    const discountAmount = computeDiscount(coupon, subtotal);

    return { valid: true, coupon, discountAmount };
  }

  async applyCoupon(userId: string, code: string): Promise<ICart> {
    const cart = await this.getOrCreateCart(userId);
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const result = await this.validateCoupon(code, subtotal);

    if (!result.valid) {
      throw new AppError(400, result.errorMessage ?? 'Invalid coupon code');
    }

    cart.couponCode = code.toUpperCase();
    await cart.save();

    return cart;
  }

  async removeCoupon(userId: string): Promise<ICart> {
    const cart = await this.getOrCreateCart(userId);
    cart.couponCode = undefined;
    await cart.save();
    return cart;
  }

  // -------------------------------------------------------------------------
  // Stock validation
  // -------------------------------------------------------------------------

  async validateStock(items: ICartItem[]): Promise<StockValidationResult[]> {
    const LOW_STOCK_THRESHOLD = 5;
    const results: StockValidationResult[] = [];

    for (const item of items) {
      let availableQty = 0;

      try {
        const inventoryItems = await prisma.inventoryItem.findMany({
          where: item.variantId
            ? { variantId: item.variantId }
            : {
                variant: {
                  sku: item.sku,
                },
              },
        });

        availableQty = inventoryItems.reduce(
          (sum, inv) => sum + Math.max(0, inv.quantity - inv.reserved),
          0
        );
      } catch {
        availableQty = 0;
      }

      let status: 'in_stock' | 'low_stock' | 'out_of_stock';
      if (availableQty <= 0) {
        status = 'out_of_stock';
      } else if (availableQty <= LOW_STOCK_THRESHOLD) {
        status = 'low_stock';
      } else {
        status = 'in_stock';
      }

      results.push({
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        requestedQty: item.quantity,
        availableQty,
        status,
      });
    }

    return results;
  }
}

export const cartService = new CartService();
