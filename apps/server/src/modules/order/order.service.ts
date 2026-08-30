import { OrderModel, prisma, type IOrder } from '@repo/db';
import { resolveWholesaleUnitPrice, type WholesaleTier } from '@repo/types/product-schemas';
import { validStatusesFor } from '@repo/types';
import { loyaltyTierService } from '../loyalty-tier/loyalty-tier.service.js';
import { eventBus } from '../../common/events/event-bus.js';
import { AppError } from '../../common/middleware/error-handler.js';
import { paymentService } from '../payment/payment.service.js';
import { phoneService } from '../phone/phone.service.js';

type PaymentMethod = 'online' | 'cod' | 'bank_transfer';

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
  customerType?: string; // 'WHOLESALE' | 'RETAIL' — admin buyer-type filter
}

export class OrderService {
  async getAll(params: GetAllParams = {}) {
    const { page = 1, limit = 20, status, dateFrom, dateTo, minAmount, maxAmount, search, customerType } = params;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }
    if (customerType === 'WHOLESALE' || customerType === 'RETAIL') {
      filter.customerType = customerType;
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

  /**
   * Per-customer order roll-up across ALL signed-in customers in a single pass.
   * Keyed by Clerk userId (guest orders — those without a userId — are excluded,
   * they belong to no account). Feeds the admin Customers table so it can show
   * order count + lifetime spend + recency without one round-trip per customer.
   *
   * - `orders`      — every order the customer ever placed (any status)
   * - `paidOrders`  — orders that reached a paid-ish status
   * - `totalSpent`  — Σ totalAmount over paid-ish orders (matches getUserSpend / loyalty)
   * - `lastOrderAt` / `firstOrderAt` — recency + tenure
   */
  async getCustomerAggregates(): Promise<
    Array<{
      userId: string;
      orders: number;
      paidOrders: number;
      totalSpent: number;
      lastOrderAt: string | null;
      firstOrderAt: string | null;
    }>
  > {
    const PAID = ['paid', 'processing', 'shipped', 'delivered'];
    const rows = await OrderModel.aggregate([
      { $match: { userId: { $nin: [null, ''] } } },
      {
        $group: {
          _id: '$userId',
          orders: { $sum: 1 },
          paidOrders: { $sum: { $cond: [{ $in: ['$status', PAID] }, 1, 0] } },
          totalSpent: { $sum: { $cond: [{ $in: ['$status', PAID] }, '$totalAmount', 0] } },
          lastOrderAt: { $max: '$createdAt' },
          firstOrderAt: { $min: '$createdAt' },
        },
      },
    ]);

    return rows.map((r) => ({
      userId: r._id as string,
      orders: r.orders as number,
      paidOrders: r.paidOrders as number,
      totalSpent: r.totalSpent as number,
      lastOrderAt: r.lastOrderAt ? new Date(r.lastOrderAt).toISOString() : null,
      firstOrderAt: r.firstOrderAt ? new Date(r.firstOrderAt).toISOString() : null,
    }));
  }

  async getById(id: string) {
    const order = await OrderModel.findById(id).lean();
    if (!order) throw new AppError(404, 'Order not found');
    return order;
  }

  /**
   * SERVER-AUTHORITATIVE pricing for a set of lines — the single source of truth
   * shared by {@link create} (persisted) and {@link quote} (display preview), so a
   * price shown in the cart/checkout always matches what the customer is charged.
   *
   * The client only supplies product ids + quantities; every unit price, the
   * wholesale tier resolution, the retail baseline and the loyalty/personal
   * discount are rebuilt from the catalog here — client-sent money is never
   * trusted. Wholesale tier pricing applies only to signed-in WHOLESALE
   * customers; the loyalty/personal % discount applies only to signed-in RETAIL
   * customers. Guests get neither.
   */
  private async computePricing(userId: string | undefined, itemsInput: OrderLineInput[]): Promise<{
    isWholesale: boolean;
    lines: Array<{
      productId: string;
      variantId?: string;
      name: string;
      sku: string;
      price: number; // effective unit price (cents) — wholesale tier or retail
      retailUnitPrice: number; // retail unit price (cents) before wholesale tiers
      quantity: number;
      imageUrl: string;
      attributes: Record<string, string>;
    }>;
    subtotal: number; // Σ effective unit × qty
    retailSubtotal: number; // Σ retail unit × qty
    wholesaleSavings: number; // retailSubtotal − subtotal (wholesale tier savings)
    discountPercent: number; // loyalty/personal % applied to the subtotal
    discountAmount: number; // round(subtotal × discountPercent / 100)
  }> {
    if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
      throw new AppError(400, 'Order must contain at least one item');
    }

    // Wholesale pricing + personal discount are signed-in account privileges.
    let isWholesale = false;
    let personalDiscountPercent = 0;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { customerType: true, personalDiscountPercent: true },
      });
      isWholesale = user?.customerType === 'WHOLESALE';
      // Admin-set per-customer discount (percent). Clamped defensively.
      personalDiscountPercent = Math.min(100, Math.max(0, user?.personalDiscountPercent ?? 0));
    }

    const productIds = [...new Set(itemsInput.map((i) => i.productId))];
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
    const lines = itemsInput.map((line) => {
      const product = byId.get(line.productId);
      if (!product || !product.isActive) {
        throw new AppError(400, `Product not available: ${line.productId}`);
      }
      const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1));
      const retailUnitPrice = product.salePrice ?? product.price; // retail unit price (cents)
      const price = resolveWholesaleUnitPrice({
        basePrice: retailUnitPrice,
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
        retailUnitPrice,
        quantity,
        imageUrl: product.images[0] ?? '',
        attributes: line.attributes ?? {},
      };
    });

    const subtotal = lines.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const retailSubtotal = lines.reduce((sum, i) => sum + i.retailUnitPrice * i.quantity, 0);
    const wholesaleSavings = Math.max(0, retailSubtotal - subtotal);

    // Loyalty discount: signed-in RETAIL customers only. The tier is resolved
    // from lifetime cumulative paid spend (this pending order not yet counted),
    // and applies to the goods subtotal. Guests and wholesale get nothing. A
    // manual per-customer discount (personalDiscountPercent) overrides the tier
    // when it is higher.
    let discountPercent = 0;
    let discountAmount = 0;
    if (userId && !isWholesale) {
      const spent = await this.getUserSpend(userId);
      const loyaltyPercent = await loyaltyTierService.resolvePercent(spent);
      discountPercent = Math.max(loyaltyPercent, personalDiscountPercent);
      discountAmount = Math.round((subtotal * discountPercent) / 100);
    }

    return { isWholesale, lines, subtotal, retailSubtotal, wholesaleSavings, discountPercent, discountAmount };
  }

  /**
   * Non-persisting price preview mirroring {@link create} exactly — so the cart,
   * checkout summary and receipt can show the real subtotal, wholesale savings
   * and loyalty discount BEFORE an order exists. Shipping is intentionally
   * excluded (it is chosen client-side at checkout); `total` is goods − discount.
   */
  async quote(input: { userId?: string | null; items: OrderLineInput[] }) {
    const userId = input.userId || undefined;
    const p = await this.computePricing(userId, input.items ?? []);
    return {
      isWholesale: p.isWholesale,
      subtotal: p.subtotal,
      retailSubtotal: p.retailSubtotal,
      wholesaleSavings: p.wholesaleSavings,
      discountPercent: p.discountPercent,
      discountAmount: p.discountAmount,
      total: p.subtotal - p.discountAmount,
      lines: p.lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.price,
        retailUnitPrice: l.retailUnitPrice,
        lineTotal: l.price * l.quantity,
      })),
    };
  }

  /**
   * Create an order with SERVER-AUTHORITATIVE pricing (see {@link computePricing}).
   * The client only supplies product ids + quantities; totals are rebuilt here.
   */
  async create(input: {
    userId?: string | null;
    guestEmail?: string;
    sessionId?: string;
    items: OrderLineInput[];
    shippingAddress: IOrder['shippingAddress'];
    billingAddress?: IOrder['billingAddress'];
    shipping?: { method: string; cost: number };
    paymentMethod?: PaymentMethod;
    pickupPointId?: string;
  }) {
    const userId = input.userId || undefined;
    const guestEmail = input.guestEmail?.trim() || undefined;
    const sessionId = input.sessionId?.trim() || undefined;
    // Payment method drives the order lifecycle: 'online' → Stripe intent later;
    // 'cod'/'bank_transfer' → order stays pending with no intent (admin advances).
    const paymentMethod: PaymentMethod =
      input.paymentMethod === 'cod' || input.paymentMethod === 'bank_transfer'
        ? input.paymentMethod
        : 'online';
    const paymentProvider = paymentMethod === 'online' ? 'stripe' : paymentMethod;
    const pickupPointId = input.pickupPointId?.trim() || undefined;

    if (!userId && !guestEmail) {
      throw new AppError(400, 'Sign in or provide an email to place an order');
    }
    if (!input.shippingAddress) {
      throw new AppError(400, 'Shipping address is required');
    }

    const pricing = await this.computePricing(userId, input.items);
    const isWholesale = pricing.isWholesale;
    // Drop the display-only retailUnitPrice before persisting the order lines.
    const items = pricing.lines.map(({ retailUnitPrice: _retail, ...line }) => line);

    const subtotal = pricing.subtotal;
    const discountAmount = pricing.discountAmount;
    const shippingCost = Math.max(0, Math.round(Number(input.shipping?.cost) || 0));
    const taxAmount = 0; // catalog prices are VAT-inclusive
    const totalAmount = subtotal + shippingCost - discountAmount;

    const order = await OrderModel.create({
      orderNumber: generateOrderNumber(),
      userId,
      guestEmail,
      sessionId,
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
      customerType: isWholesale ? 'WHOLESALE' : 'RETAIL',
      channel: 'full',
      pickupPointId,
      paymentMethod,
      payment: {
        provider: paymentProvider,
        paymentIntentId: '',
        status: 'pending',
        amount: totalAmount,
        refundedAmount: 0,
      },
    });

    // Remember the phone on the account for signed-in buyers (best effort — never
    // blocks order creation on a bad/duplicate number).
    if (userId && input.shippingAddress?.phone) {
      await phoneService.rememberFromOrder(userId, input.shippingAddress.phone);
    }

    eventBus.emit('order.created', {
      orderId: order.id as string,
      userId: userId ?? '',
      totalAmount,
    });

    return order;
  }

  async updateStatus(id: string, status: IOrder['status']) {
    const current = await OrderModel.findById(id);
    if (!current) throw new AppError(404, 'Order not found');

    // Reject statuses that don't apply to this order's delivery method: pickup
    // orders can't be shipped/delivered, courier orders can't be picked_up.
    const valid = validStatusesFor(current.shipping?.method) as string[];
    if (!valid.includes(status)) {
      throw new AppError(400, `Status "${status}" is not valid for delivery method "${current.shipping?.method ?? 'courier'}"`);
    }

    const update: Record<string, unknown> = { status };
    // Cash on delivery is settled at hand-off: auto-record the payment when the
    // order reaches delivered/picked_up (admin can still override it manually).
    if (
      current.paymentMethod === 'cod' &&
      (status === 'delivered' || status === 'picked_up') &&
      current.payment?.status === 'pending'
    ) {
      update['payment.status'] = 'succeeded';
      update['payment.paidAt'] = new Date();
    }

    const order = await OrderModel.findByIdAndUpdate(id, update, { new: true }).lean();
    eventBus.emit('order.updated', { orderId: id, status });
    return order;
  }

  /**
   * Set the payment status by hand — for cash-on-delivery and bank-transfer orders
   * that have no Stripe webhook to drive it. Online (Stripe) orders are driven by
   * the webhook and shouldn't normally be touched here.
   */
  async updatePaymentStatus(id: string, status: IOrder['payment']['status']) {
    const allowed = ['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'];
    if (!allowed.includes(status)) throw new AppError(400, 'Invalid payment status');

    const update: Record<string, unknown> = { 'payment.status': status };
    if (status === 'succeeded') update['payment.paidAt'] = new Date();

    const order = await OrderModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!order) throw new AppError(404, 'Order not found');

    eventBus.emit('order.updated', { orderId: id, status: order.status });
    return order;
  }

  async addTracking(id: string, data: {
    carrier: string;
    trackingNumber: string;
    estimatedDelivery?: Date;
  }) {
    const currentOrder = await OrderModel.findById(id);
    if (!currentOrder) throw new AppError(404, 'Order not found');

    // Self-pickup orders are never shipped by a carrier — no tracking applies.
    if (currentOrder.shipping?.method === 'pickup') {
      throw new AppError(400, 'Pickup orders have no shipment tracking');
    }

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
      userId: order!.userId ?? '',
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
