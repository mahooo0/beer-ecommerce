import { z } from 'zod';

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    logo: z.string().optional(),
    website: z.string().url().optional(),
  }),
});

export const updateBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    logo: z.string().optional(),
    website: z.string().url().optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  }),
});
