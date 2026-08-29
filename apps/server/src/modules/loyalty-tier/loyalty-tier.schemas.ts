import { z } from 'zod';

export const createLoyaltyTierSchema = z.object({
  body: z.object({
    minSpendCents: z.number().int().min(0),
    percent: z.number().int().min(0).max(100),
    active: z.boolean().optional(),
    position: z.number().int().optional(),
  }),
});

export const updateLoyaltyTierSchema = z.object({
  body: z.object({
    minSpendCents: z.number().int().min(0).optional(),
    percent: z.number().int().min(0).max(100).optional(),
    active: z.boolean().optional(),
    position: z.number().int().optional(),
  }),
});
