/// <reference path="./clerk.d.ts" />

// ============================================================================
// ENUMS
// ============================================================================

export const Role = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ProductType = {
  SIMPLE: 'SIMPLE',
  VARIABLE: 'VARIABLE',
  WEIGHTED: 'WEIGHTED',
  DIGITAL: 'DIGITAL',
  BUNDLED: 'BUNDLED',
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const ProductStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const WeightUnit = {
  KG: 'KG',
  LB: 'LB',
  OZ: 'OZ',
  G: 'G',
} as const;
export type WeightUnit = (typeof WeightUnit)[keyof typeof WeightUnit];

export const AttributeType = {
  SELECT: 'SELECT',
  RANGE: 'RANGE',
  BOOLEAN: 'BOOLEAN',
  TEXT: 'TEXT',
} as const;
export type AttributeType = (typeof AttributeType)[keyof typeof AttributeType];

export const ReviewStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FLAGGED: 'FLAGGED',
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  FREE_SHIPPING: 'FREE_SHIPPING',
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const PromotionType = {
  BOGO: 'BOGO',
  TIERED_PRICING: 'TIERED_PRICING',
  FLASH_SALE: 'FLASH_SALE',
  AUTOMATIC_DISCOUNT: 'AUTOMATIC_DISCOUNT',
} as const;
export type PromotionType = (typeof PromotionType)[keyof typeof PromotionType];

export const ShippingRateType = {
  FLAT_RATE: 'FLAT_RATE',
  WEIGHT_BASED: 'WEIGHT_BASED',
  PRICE_BASED: 'PRICE_BASED',
} as const;
export type ShippingRateType = (typeof ShippingRateType)[keyof typeof ShippingRateType];

export const StockMovementReason = {
  SALE: 'SALE',
  RETURN: 'RETURN',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
  DAMAGE: 'DAMAGE',
  RESTOCK: 'RESTOCK',
  RESERVATION: 'RESERVATION',
  RESERVATION_RELEASE: 'RESERVATION_RELEASE',
} as const;
export type StockMovementReason = (typeof StockMovementReason)[keyof typeof StockMovementReason];

export const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
  REFUND_REQUESTED: 'REFUND_REQUESTED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

// ============================================================================
// USER & AUTH DOMAIN
// ============================================================================

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  label?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// WISHLIST DOMAIN
// ============================================================================

export interface Wishlist {
  id: string;
  name: string;
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  addedAt: Date;
  priceAtAdd: number;
  notifyOnPriceDrop: boolean;
  notifyOnRestock: boolean;
}

// ============================================================================
// WISHLIST EVENT TYPES
// ============================================================================

export interface WishlistPriceDropEvent {
  productId: string;
  oldPrice: number;
  newPrice: number;
  affectedUserIds: string[];
}

export interface WishlistRestockEvent {
  productId: string;
  affectedUserIds: string[];
}

// ============================================================================
// REVIEW DOMAIN
// ============================================================================

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  photos: string[];
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PRODUCT CATALOG DOMAIN
// ============================================================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // cents
  compareAtPrice?: number; // cents
  images: string[];
  sku: string;
  productType: ProductType;
  status: ProductStatus;
  attributes: Record<string, any>;
  isActive: boolean;
  categoryId: string;
  brandId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  price: number; // cents
  compareAtPrice?: number; // cents
  stock: number;
  isActive: boolean;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DigitalMeta {
  id: string;
  productId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number; // bytes
  fileFormat: string;
  maxDownloads?: number;
  accessDuration?: number; // days
}

export interface WeightedMeta {
  id: string;
  productId: string;
  unit: WeightUnit;
  pricePerUnit: number; // cents
  minWeight?: number;
  maxWeight?: number;
  stepWeight?: number;
}

export interface BundleItem {
  id: string;
  bundleProductId: string;
  productId: string;
  quantity: number;
  discount: number; // cents
}

// ============================================================================
// CATEGORY DOMAIN
// ============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  path: string;
  depth: number;
  position: number;
  parentId?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryAttribute {
  id: string;
  name: string;
  key: string;
  type: AttributeType;
  values: string[];
  unit?: string;
  isFilterable: boolean;
  isRequired: boolean;
  position: number;
  categoryId: string;
}

// ============================================================================
// PRODUCT VARIANT & OPTIONS DOMAIN
// ============================================================================

export interface OptionGroup {
  id: string;
  name: string;
  displayName: string;
  createdAt: Date;
}

export interface OptionValue {
  id: string;
  value: string;
  label?: string;
  groupId: string;
}

export interface VariantOption {
  id: string;
  variantId: string;
  optionId: string;
}

// ============================================================================
// BRAND, TAG, COLLECTION DOMAIN
// ============================================================================

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const TagType = {
  PRODUCT: 'PRODUCT',
  COLLECTION: 'COLLECTION',
  BLOG: 'BLOG',
  CUSTOM: 'CUSTOM',
} as const;
export type TagType = (typeof TagType)[keyof typeof TagType];

export interface Tag {
  id: string;
  name: string;
  slug: string;
  type: TagType;
  createdAt: Date;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DISCOUNT & PROMOTION DOMAIN
// ============================================================================

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number; // percentage or cents
  minOrderAmount?: number; // cents
  maxDiscountAmount?: number; // cents
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit: number;
  applicableProductIds: string[];
  applicableCategoryIds: string[];
  startsAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: PromotionType;
  discountType: DiscountType;
  discountValue: number; // cents or percentage
  conditions: Record<string, any>;
  applicableProductIds: string[];
  applicableCategoryIds: string[];
  stackable: boolean;
  priority: number;
  usageLimit?: number;
  usageCount: number;
  startsAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SHIPPING DOMAIN
// ============================================================================

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  states: string[];
  isActive: boolean;
  freeShippingThreshold?: number; // cents
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  zoneId: string;
  rateType: ShippingRateType;
  flatRate?: number; // cents
  weightRate?: number; // cents per kg
  minWeight?: number;
  maxWeight?: number;
  priceThresholds?: Record<string, any>;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  isActive: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// WAREHOUSE & INVENTORY DOMAIN
// ============================================================================

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  variantId: string;
  warehouseId: string;
  quantity: number;
  reserved: number;
  lowStockThreshold: number;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  quantity: number;
  reason: StockMovementReason;
  reference?: string;
  note?: string;
  createdAt: Date;
}

// ============================================================================
// MONGODB ORDER TYPES
// ============================================================================

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  price: number; // cents
  quantity: number;
  imageUrl: string;
  attributes?: Record<string, string>;
}

export interface OrderAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface ShippingInfo {
  method: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cost: number; // cents
}

export interface PaymentInfo {
  provider: string;
  paymentIntentId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';
  amount: number; // cents
  refundedAmount: number; // cents
  paidAt?: Date;
}

export interface OrderStatusChange {
  from: string;
  to: string;
  changedAt: Date;
  changedBy?: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  guestEmail?: string;
  items: OrderItem[];
  status: OrderStatus;
  statusHistory: OrderStatusChange[];
  subtotal: number; // cents
  taxAmount: number; // cents
  shippingCost: number; // cents
  discountAmount: number; // cents
  totalAmount: number; // cents
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  shipping?: ShippingInfo;
  payment: PaymentInfo;
  couponCode?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// MONGODB CART TYPES
// ============================================================================

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number; // cents
  quantity: number;
  imageUrl: string;
  sku: string;
  attributes?: Record<string, string>;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  couponCode?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// API UTILITY TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export * from './product-schemas';
