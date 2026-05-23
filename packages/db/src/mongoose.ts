// All monetary values stored as integers (cents). 1299 = $12.99.

import mongoose, { Schema, type Document } from 'mongoose';

// ============================================================================
// ORDER INTERFACES
// ============================================================================

export interface IOrderItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  price: number; // cents
  quantity: number;
  imageUrl: string;
  attributes?: Record<string, string>; // e.g., { size: "L", color: "Red" }
}

export interface IShippingInfo {
  method: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cost: number; // cents
}

export interface IPaymentInfo {
  provider: string; // default "stripe"
  paymentIntentId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';
  amount: number; // cents
  refundedAmount: number; // default 0
  paidAt?: Date;
}

export interface IOrderAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface IOrderStatusChange {
  from: string;
  to: string;
  changedAt: Date;
  changedBy?: string;
  note?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: string;
  guestEmail?: string;
  items: IOrderItem[];
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refund_requested';
  statusHistory: IOrderStatusChange[];
  subtotal: number; // cents
  taxAmount: number; // cents
  shippingCost: number; // cents
  discountAmount: number; // cents
  totalAmount: number; // cents
  shippingAddress: IOrderAddress;
  billingAddress?: IOrderAddress;
  shipping?: IShippingInfo;
  payment: IPaymentInfo;
  couponCode?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CART INTERFACES
// ============================================================================

export interface ICartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number; // cents
  quantity: number;
  imageUrl: string;
  sku: string;
  attributes?: Record<string, string>;
}

export interface ICart extends Document {
  userId?: string;
  sessionId?: string;
  items: ICartItem[];
  couponCode?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ORDER SCHEMAS
// ============================================================================

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  variantId: { type: String },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  attributes: { type: Schema.Types.Mixed },
});

const ShippingInfoSchema = new Schema<IShippingInfo>({
  method: { type: String, required: true },
  carrier: { type: String },
  trackingNumber: { type: String },
  estimatedDelivery: { type: Date },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
  cost: { type: Number, required: true },
});

const PaymentInfoSchema = new Schema<IPaymentInfo>({
  provider: { type: String, required: true, default: 'stripe' },
  paymentIntentId: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'],
  },
  amount: { type: Number, required: true },
  refundedAmount: { type: Number, required: true, default: 0 },
  paidAt: { type: Date },
});

const OrderAddressSchema = new Schema<IOrderAddress>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String },
});

const OrderStatusChangeSchema = new Schema<IOrderStatusChange>({
  from: { type: String, required: true },
  to: { type: String, required: true },
  changedAt: { type: Date, required: true, default: Date.now },
  changedBy: { type: String },
  note: { type: String },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    guestEmail: { type: String },
    items: { type: [OrderItemSchema], required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refund_requested'],
      default: 'pending',
    },
    statusHistory: { type: [OrderStatusChangeSchema], default: [] },
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    discountAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    shippingAddress: { type: OrderAddressSchema, required: true },
    billingAddress: { type: OrderAddressSchema },
    shipping: { type: ShippingInfoSchema },
    payment: { type: PaymentInfoSchema, required: true },
    couponCode: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
);

// Indexes for Order
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

export const OrderModel = (mongoose.models.Order ??
  mongoose.model<IOrder>('Order', OrderSchema)) as mongoose.Model<IOrder>;

// ============================================================================
// CART SCHEMAS
// ============================================================================

const CartItemSchema = new Schema<ICartItem>({
  productId: { type: String, required: true },
  variantId: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  imageUrl: { type: String, required: true },
  sku: { type: String, required: true },
  attributes: { type: Schema.Types.Mixed },
});

const CartSchema = new Schema<ICart>(
  {
    userId: { type: String },
    sessionId: { type: String },
    items: { type: [CartItemSchema], default: [] },
    couponCode: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

// Indexes for Cart
CartSchema.index({ userId: 1 }, { sparse: true });
CartSchema.index({ sessionId: 1 }, { sparse: true });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-validate hook: ensure either userId or sessionId exists
CartSchema.pre('validate', function (next) {
  if (!this.userId && !this.sessionId) {
    next(new Error('Cart must have either userId or sessionId'));
  } else {
    next();
  }
});

export const CartModel = (mongoose.models.Cart ??
  mongoose.model<ICart>('Cart', CartSchema)) as mongoose.Model<ICart>;

// ============================================================================
// CONNECTION FUNCTION
// ============================================================================

export async function connectMongoDB(uri: string): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  }
}

export { mongoose };
