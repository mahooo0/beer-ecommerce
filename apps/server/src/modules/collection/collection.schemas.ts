import { z } from 'zod';

export const createCollectionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    image: z.string().optional(),
    isActive: z.boolean().default(true),
  }),
});

export const updateCollectionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    isActive: z.boolean().optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  }),
});

export const addProductSchema = z.object({
  body: z.object({
    productId: z.string(),
    position: z.number().default(0),
  }),
});

export const reorderProductsSchema = z.object({
  body: z.object({
    orderedProductIds: z.array(z.string()),
  }),
});
