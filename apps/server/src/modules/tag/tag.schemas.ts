import { z } from 'zod';

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    type: z.enum(['PRODUCT', 'COLLECTION', 'BLOG', 'CUSTOM']).optional(),
  }),
});

export const updateTagSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    type: z.enum(['PRODUCT', 'COLLECTION', 'BLOG', 'CUSTOM']).optional(),
  }),
});
