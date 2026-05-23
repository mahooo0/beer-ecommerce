import { z } from 'zod';

// Inner item schema (reused in mergeCartSchema)
const cartItemBodySchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  name: z.string().min(1),
  price: z.number().int().min(0),
  quantity: z.number().int().min(1),
  imageUrl: z.string().url(),
  sku: z.string().min(1),
  attributes: z.record(z.string()).optional(),
});

export const addItemSchema = z.object({
  body: cartItemBodySchema,
});

export const updateQuantitySchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1),
  }),
});

export const removeItemSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    variantId: z.string().optional(),
  }),
});

export const mergeCartSchema = z.object({
  body: z.object({
    items: z.array(cartItemBodySchema),
    couponCode: z.string().nullable().optional(),
    sessionId: z.string().optional(),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1).transform((v) => v.toUpperCase()),
  }),
});

// Raw body schemas for controller-level parsing (without body wrapper)
export const addItemBodySchema = cartItemBodySchema;
export const updateQuantityBodySchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1),
});
export const removeItemBodySchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
});
export const mergeCartBodySchema = z.object({
  items: z.array(cartItemBodySchema),
  couponCode: z.string().nullable().optional(),
  sessionId: z.string().optional(),
});
export const applyCouponBodySchema = z.object({
  code: z.string().min(1).transform((v) => v.toUpperCase()),
});
