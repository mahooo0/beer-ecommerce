import { z } from 'zod';

export const addItemSchema = z.object({
  productId: z.string().min(1),
  priceAtAdd: z.number().int().min(0),
});

export const syncSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      priceAtAdd: z.number().int().min(0),
    })
  ),
});

export const notifySchema = z.object({
  notifyOnPriceDrop: z.boolean().optional(),
  notifyOnRestock: z.boolean().optional(),
});
