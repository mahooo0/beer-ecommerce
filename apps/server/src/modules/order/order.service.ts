import { OrderModel, type IOrder } from '@repo/db';
import { eventBus } from '../../common/events/event-bus.js';
import { AppError } from '../../common/middleware/error-handler.js';
import { paymentService } from '../payment/payment.service.js';

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

  async getById(id: string) {
    const order = await OrderModel.findById(id).lean();
    if (!order) throw new AppError(404, 'Order not found');
    return order;
  }

  async create(data: {
    userId: string;
    items: IOrder['items'];
    shippingAddress: IOrder['shippingAddress'];
    totalAmount: number;
  } & Record<string, any>) {
    const order = await OrderModel.create({
      ...data,
      status: data.status || 'pending',
    });

    eventBus.emit('order.created', {
      orderId: order.id as string,
      userId: data.userId,
      totalAmount: data.totalAmount,
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
