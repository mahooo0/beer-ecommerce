// All monetary values stored as integers (cents). 1299 = $12.99.

import { faker } from '@faker-js/faker';

// Set seed for reproducible data
faker.seed(12345);

// ============================================================================
// USER FACTORIES
// ============================================================================

export interface UserInput {
  clerkId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  avatar?: string;
  phone?: string;
  isActive?: boolean;
}

export function createUser(overrides?: UserInput) {
  return {
    clerkId: overrides?.clerkId ?? faker.string.uuid(),
    email: overrides?.email ?? faker.internet.email(),
    firstName: overrides?.firstName ?? faker.person.firstName(),
    lastName: overrides?.lastName ?? faker.person.lastName(),
    role: overrides?.role ?? 'CUSTOMER',
    avatar: overrides?.avatar ?? faker.image.avatar(),
    phone: overrides?.phone ?? faker.phone.number(),
    isActive: overrides?.isActive ?? true,
  };
}

// ============================================================================
// CATEGORY FACTORIES
// ============================================================================

export interface CategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  position?: number;
  metaTitle?: string;
  metaDescription?: string;
}

export function createCategory(
  depth: number,
  parentPath: string,
  parentId?: string,
  overrides?: CategoryInput
) {
  const name = overrides?.name ?? faker.commerce.department();
  const slug = overrides?.slug ?? `${faker.helpers.slugify(name).toLowerCase()}-${faker.string.alphanumeric(4)}`;
  const path = parentPath ? `${parentPath}.${slug}` : slug;

  return {
    name,
    slug,
    description: overrides?.description ?? faker.commerce.productDescription(),
    image: overrides?.image ?? faker.image.urlLoremFlickr({ category: 'business' }),
    path,
    depth,
    position: overrides?.position ?? faker.number.int({ min: 0, max: 100 }),
    parentId: parentId ?? null,
    metaTitle: overrides?.metaTitle ?? name,
    metaDescription: overrides?.metaDescription ?? faker.lorem.sentence(),
  };
}

// ============================================================================
// BRAND FACTORIES
// ============================================================================

export interface BrandInput {
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
  website?: string;
}

export function createBrand(overrides?: BrandInput) {
  const name = overrides?.name ?? faker.company.name();
  return {
    name,
    slug: overrides?.slug ?? faker.helpers.slugify(name).toLowerCase(),
    description: overrides?.description ?? faker.company.catchPhrase(),
    logo: overrides?.logo ?? faker.image.urlLoremFlickr({ category: 'business' }),
    website: overrides?.website ?? faker.internet.url(),
  };
}

// ============================================================================
// PRODUCT FACTORIES
// ============================================================================

export interface ProductInput {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  images?: string[];
  sku?: string;
  productType?: 'SIMPLE' | 'VARIABLE' | 'WEIGHTED' | 'DIGITAL' | 'BUNDLED';
  attributes?: Record<string, any>;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isActive?: boolean;
}

export function createProduct(
  categoryId: string,
  brandId?: string,
  overrides?: ProductInput
) {
  const name = overrides?.name ?? faker.commerce.productName();
  const slug = overrides?.slug ??
    `${faker.helpers.slugify(name).toLowerCase()}-${faker.string.alphanumeric(6)}`;

  return {
    name,
    slug,
    description: overrides?.description ?? faker.commerce.productDescription(),
    price: overrides?.price ?? faker.number.int({ min: 999, max: 99999 }),
    compareAtPrice: overrides?.compareAtPrice,
    images: overrides?.images ?? [
      faker.image.urlLoremFlickr({ category: 'product' }),
      faker.image.urlLoremFlickr({ category: 'product' }),
      faker.image.urlLoremFlickr({ category: 'product' }),
    ],
    sku: overrides?.sku ?? faker.string.alphanumeric(8).toUpperCase(),
    productType: overrides?.productType ?? 'SIMPLE',
    attributes: overrides?.attributes ?? {},
    status: overrides?.status ?? 'ACTIVE',
    isActive: overrides?.isActive ?? true,
    categoryId,
    brandId: brandId ?? null,
  };
}

// ============================================================================
// PRODUCT VARIANT FACTORIES
// ============================================================================

export interface ProductVariantInput {
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  isActive?: boolean;
  images?: string[];
}

export function createProductVariant(
  productId: string,
  overrides?: ProductVariantInput
) {
  return {
    productId,
    sku: overrides?.sku ?? faker.string.alphanumeric(8).toUpperCase(),
    price: overrides?.price ?? faker.number.int({ min: 999, max: 99999 }),
    compareAtPrice: overrides?.compareAtPrice,
    stock: overrides?.stock ?? faker.number.int({ min: 0, max: 100 }),
    isActive: overrides?.isActive ?? true,
    images: overrides?.images ?? [],
  };
}

// ============================================================================
// REVIEW FACTORIES
// ============================================================================

export interface ReviewInput {
  rating?: number;
  title?: string;
  body?: string;
  photos?: string[];
  isVerifiedPurchase?: boolean;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  helpfulCount?: number;
}

export function createReview(
  userId: string,
  productId: string,
  overrides?: ReviewInput
) {
  return {
    userId,
    productId,
    rating: overrides?.rating ?? faker.number.int({ min: 1, max: 5 }),
    title: overrides?.title ?? faker.lorem.sentence(),
    body: overrides?.body ?? faker.lorem.paragraph(),
    photos: overrides?.photos ?? (faker.datatype.boolean() ? [faker.image.urlLoremFlickr({ category: 'product' })] : []),
    isVerifiedPurchase: overrides?.isVerifiedPurchase ?? faker.datatype.boolean(),
    status: overrides?.status ?? 'APPROVED',
    helpfulCount: overrides?.helpfulCount ?? faker.number.int({ min: 0, max: 50 }),
  };
}

// ============================================================================
// COUPON FACTORIES
// ============================================================================

export interface CouponInput {
  code?: string;
  description?: string;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  startsAt?: Date;
  expiresAt?: Date;
  isActive?: boolean;
}

export function createCoupon(overrides?: CouponInput) {
  const startsAt = overrides?.startsAt ?? faker.date.past();
  const expiresAt = overrides?.expiresAt ?? faker.date.future();

  return {
    code: overrides?.code ?? faker.string.alphanumeric(8).toUpperCase(),
    description: overrides?.description ?? faker.lorem.sentence(),
    discountType: overrides?.discountType ?? faker.helpers.arrayElement(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
    discountValue: overrides?.discountValue ?? faker.number.int({ min: 500, max: 5000 }),
    minOrderAmount: overrides?.minOrderAmount,
    maxDiscountAmount: overrides?.maxDiscountAmount,
    usageLimit: overrides?.usageLimit ?? faker.number.int({ min: 10, max: 1000 }),
    usageCount: 0,
    perCustomerLimit: overrides?.perCustomerLimit ?? 1,
    applicableProductIds: [],
    applicableCategoryIds: [],
    startsAt,
    expiresAt,
    isActive: overrides?.isActive ?? true,
  };
}

// ============================================================================
// ORDER DATA FACTORIES (MongoDB)
// ============================================================================

export interface OrderDataInput {
  orderNumber?: string;
  status?: string;
  guestEmail?: string;
  subtotal?: number;
  taxAmount?: number;
  shippingCost?: number;
  discountAmount?: number;
  totalAmount?: number;
  couponCode?: string;
  notes?: string;
  createdAt?: Date;
}

export function createOrderData(
  userId: string,
  items: any[],
  overrides?: OrderDataInput
) {
  const orderNumber = overrides?.orderNumber ?? `ORD-${faker.string.alphanumeric(8).toUpperCase()}`;
  const status = overrides?.status ?? faker.helpers.arrayElement([
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ]);

  // Spread creation dates across the last 90 days
  const createdAt = overrides?.createdAt ?? faker.date.between({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const subtotal = overrides?.subtotal ?? items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const taxAmount = overrides?.taxAmount ?? Math.floor(subtotal * 0.08);
  const shippingCost = overrides?.shippingCost ?? faker.number.int({ min: 599, max: 1999 });

  // Some orders have discounts
  const hasDiscount = overrides?.couponCode || faker.datatype.boolean({ probability: 0.2 });
  const maxDiscount = Math.max(500, Math.min(3000, Math.floor(subtotal * 0.3)));
  const discountAmount = overrides?.discountAmount ?? (hasDiscount ? faker.number.int({ min: 100, max: maxDiscount }) : 0);
  const couponCode = hasDiscount ? (overrides?.couponCode ?? faker.helpers.arrayElement(['SAVE10', 'WELCOME15', 'SUMMER20', 'VIP25'])) : undefined;

  const totalAmount = overrides?.totalAmount ?? (subtotal + taxAmount + shippingCost - discountAmount);

  // Build coherent status history
  const statusHistory = buildStatusHistory(status, createdAt);

  // Payment dates based on status
  const isPaid = ['paid', 'processing', 'shipped', 'delivered'].includes(status);
  const paidAt = isPaid ? new Date(createdAt.getTime() + faker.number.int({ min: 60000, max: 3600000 })) : undefined;

  return {
    orderNumber,
    userId,
    guestEmail: overrides?.guestEmail,
    items,
    status,
    statusHistory,
    subtotal,
    taxAmount,
    shippingCost,
    discountAmount,
    totalAmount,
    shippingAddress: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode(),
      country: 'US',
      phone: faker.phone.number(),
    },
    billingAddress: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode(),
      country: 'US',
      phone: faker.phone.number(),
    },
    shipping: status === 'shipped' || status === 'delivered' ? {
      method: faker.helpers.arrayElement(['Standard Shipping', 'Express Shipping', 'Overnight']),
      carrier: faker.helpers.arrayElement(['USPS', 'UPS', 'FedEx', 'DHL']),
      trackingNumber: `1Z${faker.string.alphanumeric(16).toUpperCase()}`,
      estimatedDelivery: faker.date.soon({ days: 7, refDate: createdAt }),
      shippedAt: new Date(createdAt.getTime() + faker.number.int({ min: 86400000, max: 259200000 })),
      deliveredAt: status === 'delivered' ? new Date(createdAt.getTime() + faker.number.int({ min: 259200000, max: 604800000 })) : undefined,
      cost: shippingCost,
    } : undefined,
    payment: {
      provider: 'stripe',
      paymentIntentId: `pi_test_${faker.string.alphanumeric(24)}`,
      status: isPaid ? 'succeeded' : status === 'cancelled' ? 'failed' : 'pending',
      amount: totalAmount,
      refundedAmount: 0,
      paidAt,
    },
    couponCode,
    notes: overrides?.notes,
    createdAt,
    updatedAt: createdAt,
  };
}

function buildStatusHistory(finalStatus: string, createdAt: Date) {
  const history: Array<{ from: string; to: string; changedAt: Date; note: string }> = [];

  // Every order starts as pending
  const statusFlow: Record<string, string[]> = {
    pending: ['pending'],
    paid: ['pending', 'paid'],
    processing: ['pending', 'paid', 'processing'],
    shipped: ['pending', 'paid', 'processing', 'shipped'],
    delivered: ['pending', 'paid', 'processing', 'shipped', 'delivered'],
    cancelled: ['pending', 'cancelled'],
  };

  const flow = statusFlow[finalStatus] || ['pending', finalStatus];
  let elapsed = 0;

  for (let i = 1; i < flow.length; i++) {
    elapsed += faker.number.int({ min: 1800000, max: 86400000 }); // 30min to 1 day
    history.push({
      from: flow[i - 1],
      to: flow[i],
      changedAt: new Date(createdAt.getTime() + elapsed),
      note: getStatusNote(flow[i]),
    });
  }

  return history;
}

function getStatusNote(status: string): string {
  const notes: Record<string, string[]> = {
    paid: ['Payment confirmed via Stripe', 'Payment received', 'Card charged successfully'],
    processing: ['Order is being prepared', 'Items picked from warehouse', 'Processing started'],
    shipped: ['Package shipped via carrier', 'Tracking number assigned', 'Package dispatched'],
    delivered: ['Package delivered', 'Delivery confirmed', 'Left at front door'],
    cancelled: ['Cancelled by customer', 'Order cancelled', 'Payment declined — order cancelled'],
  };
  return faker.helpers.arrayElement(notes[status] || ['Status updated']);
}

// ============================================================================
// CART DATA FACTORIES (MongoDB)
// ============================================================================

export interface CartDataInput {
  userId?: string;
  sessionId?: string;
  couponCode?: string;
  expiresAt?: Date;
}

export function createCartData(overrides?: CartDataInput) {
  const isGuest = !overrides?.userId;

  return {
    userId: overrides?.userId,
    sessionId: overrides?.sessionId ?? (isGuest ? faker.string.uuid() : undefined),
    items: [],
    couponCode: overrides?.couponCode,
    expiresAt: overrides?.expiresAt ?? (isGuest ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined),
  };
}
