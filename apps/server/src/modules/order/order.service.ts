import { OrderModel, prisma, type IOrder } from '@repo/db';
import { resolveWholesaleUnitPrice, type WholesaleTier } from '@repo/types/product-schemas';
import { loyaltyTierService } from '../loyalty-tier/loyalty-tier.service.js';
import { eventBus } from '../../common/events/event-bus.js';
import { AppError } from '../../common/middleware/error-handler.js';
import { paymentService } from '../payment/payment.service.js';

/** Human-readable, collision-resistant order number, e.g. TAR-LXY2K9-4F7A. */
function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TAR-${stamp}-${rand}`;
}

/** Line as submitted by the client — only identity + quantity are trusted. */
interface OrderLineInput {
  productId: string;
  quantity: number;
  variantId?: string;
  attributes?: Record<string, string>;
}

interface GetAllParams {
  page?: number;
  limit?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export class OrderService {
  async getAll(params: GetAllParams = {}) {
    const { page = 1, limit = 20, status, dateFrom, dateTo, minAmount, maxAmount, search } = params;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    if (minAmount !== undefined || maxAmount !== undefined) {
      filter.totalAmount = {};
      if (minAmount !== undefined) filter.totalAmount.$gte = minAmount;
      if (maxAmount !== undefined) filter.totalAmount.$lte = maxAmount;
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.firstName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.lastName': { $regex: search, $options: 'i' } },
        { guestEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      OrderModel.countDocuments(filter),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getByUserId(userId: string, params: { page?: number; limit?: number; status?: string } = {}) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { userId };
    if (status) {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      OrderModel.countDocuments(filter),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Lifetime cumulative PAID spend for a user (cents). Drives loyalty tiers. */
  async getUserSpend(userId: string): Promise<number> {
    const res = await OrderModel.aggregate([
      { $match: { userId, status: { $in: ['paid', 'processing', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    return res[0]?.total ?? 0;
  }

  async getById(id: string) {
    const order = await OrderModel.findById(id).lean();
    if (!order) throw new AppError(404, 'Order not found');
    return order;
  }

  /**
   * Create an order with SERVER-AUTHORITATIVE pricing. The client only supplies
   * product ids + quantities; every price, name, sku and the totals are rebuilt
   * from the Prisma catalog here — client-sent money is never trusted. Wholesale
   * tier pricing applies only to signed-in WHOLESALE customers; guests are retail.
   */
  async create(input: {
    userId?: string | null;
    guestEmail?: string;
    items: OrderLineInput[];
    shippingAddress: IOrder['shippingAddress'];
    billingAddress?: IOrder['billingAddress'];
    shipping?: { method: string; cost: number };
  }) {
    const userId = input.userId || undefined;
    const guestEmail = input.guestEmail?.trim() || undefined;

    if (!userId && !guestEmail) {
      throw new AppError(400, 'Sign in or provide an email to place an order');
    }
    if (!input.shippingAddress) {
      throw new AppError(400, 'Shipping address is required');
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new AppError(400, 'Order must contain at least one item');
    }

    // Wholesale pricing is a signed-in WHOLESALE privilege; everyone else is retail.
    let isWholesale = false;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { customerType: true },
      });
      isWholesale = user?.customerType === 'WHOLESALE';
    }

    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        salePrice: true,
        images: true,
        wholesaleTiers: true,
        isActive: true,
      },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    // Rebuild every line from the catalog — this is where price authority lives.
    const items = input.items.map((line) => {
      const product = byId.get(line.productId);
      if (!product || !product.isActive) {
        throw new AppError(400, `Product not available: ${line.productId}`);
      }
      const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1));
      const basePrice = product.salePrice ?? product.price; // retail unit price (cents)
      const price = resolveWholesaleUnitPrice({
        basePrice,
        tiers: (product.wholesaleTiers as WholesaleTier[] | null) ?? undefined,
        quantity,
        isWholesale,
      });
      return {
        productId: product.id,
        variantId: line.variantId,
        name: product.name,
        sku: product.sku,
        price,
        quantity,
        imageUrl: product.images[0] ?? '',
        attributes: line.attributes ?? {},
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingCost = Math.max(0, Math.round(Number(input.shipping?.cost) || 0));

    // Loyalty discount: signed-in RETAIL customers only. The tier is resolved
    // from lifetime cumulative paid spend (this pending order not yet counted),
    // and applies to the goods subtotal. Guests and wholesale get nothing.
    let discountAmount = 0;
    if (userId && !isWholesale) {
      const spent = await this.getUserSpend(userId);
      const percent = await loyaltyTierService.resolvePercent(spent);
      discountAmount = Math.round((subtotal * percent) / 100);
    }

    const taxAmount = 0; // catalog prices are VAT-inclusive
    const totalAmount = subtotal + shippingCost - discountAmount;

    const order = await OrderModel.create({
      orderNumber: generateOrderNumber(),
      userId,
      guestEmail,
      items,
      status: 'pending',
      subtotal,
      taxAmount,
      shippingCost,
      discountAmount,
      totalAmount,
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress,
      shipping: input.shipping ? { method: input.shipping.method, cost: shippingCost } : undefined,
      payment: {
        provider: 'stripe',
        paymentIntentId: '',
        status: 'pending',
        amount: totalAmount,
        refundedAmount: 0,
      },
    });

    eventBus.emit('order.created', {
      orderId: order.id as string,
      userId: userId ?? '',
      totalAmount,
    });

    return order;
  }

  async updateStatus(id: string, status: IOrder['status']) {
    const order = await OrderModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!order) throw new AppError(404, 'Order not found');

    eventBus.emit('order.updated', { orderId: id, status });
    return order;
  }

  async addTracking(id: string, data: {
    carrier: string;
    trackingNumber: string;
    estimatedDelivery?: Date;
  }) {
    const currentOrder = await OrderModel.findById(id);
    if (!currentOrder) throw new AppError(404, 'Order not found');

    const shippableStatuses = ['paid', 'processing'];
    if (!shippableStatuses.includes(currentOrder.status)) {
      throw new AppError(400, `Cannot add tracking to order with status: ${currentOrder.status}`);
    }

    const order = await OrderModel.findByIdAndUpdate(
      id,
      {
        $set: {
          'shipping.carrier': data.carrier,
          'shipping.trackingNumber': data.trackingNumber,
          'shipping.shippedAt': new Date(),
          'shipping.estimatedDelivery': data.estimatedDelivery ?? null,
          status: 'shipped',
        },
        $push: {
          statusHistory: {
            from: currentOrder.status,
            to: 'shipped',
            changedAt: new Date(),
            note: `Shipped via ${data.carrier}. Tracking: ${data.trackingNumber}`,
          },
        },
      },
      { new: true }
    );

    eventBus.emit('order.shipped', {
      orderId: id,
      userId: order!.userId,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
    });

    return order;
  }

  async getOrderStats() {
    const [
      totalOrders,
      revenueResult,
      statusCounts,
    ] = await Promise.all([
      OrderModel.countDocuments(),
      OrderModel.aggregate([
        { $match: { status: { $in: ['paid', 'processing', 'shipped', 'delivered'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, avg: { $avg: '$totalAmount' } } },
      ]),
      OrderModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const revenue = revenueResult[0]?.total || 0;
    const avgOrderValue = revenueResult[0]?.avg || 0;
    const byStatus: Record<string, number> = {};
    for (const s of statusCounts) {
      byStatus[s._id] = s.count;
    }

    return {
      totalOrders,
      revenue,
      avgOrderValue: Math.round(avgOrderValue),
      byStatus,
    };
  }

  async processRefund(id: string, amount?: number) {
    const order = await OrderModel.findById(id);
    if (!order) throw new AppError(404, 'Order not found');

    if (!order.payment?.paymentIntentId) {
      throw new AppError(400, 'No payment intent found for this order');
    }

    const refund = await paymentService.createRefund(order.payment.paymentIntentId, amount);

    const refundedAmount = (order.payment.refundedAmount || 0) + refund.amount;
    const isFullRefund = refundedAmount >= order.payment.amount;

    await OrderModel.findByIdAndUpdate(id, {
      $set: {
        'payment.refundedAmount': refundedAmount,
        'payment.status': isFullRefund ? 'refunded' : 'partially_refunded',
        status: isFullRefund ? 'cancelled' : order.status,
      },
      $push: {
        statusHistory: {
          from: order.status,
          to: isFullRefund ? 'cancelled' : order.status,
          changedAt: new Date(),
          note: `Refund of $${(refund.amount / 100).toFixed(2)} processed`,
        },
      },
    });

    eventBus.emit('order.refunded', {
      orderId: id,
      refundId: refund.id,
      amount: refund.amount,
    });

    return refund;
  }
}

export const orderService = new OrderService();
