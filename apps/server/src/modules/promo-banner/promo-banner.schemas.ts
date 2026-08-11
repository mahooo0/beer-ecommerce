import { z } from 'zod';

/** Localized text stored as JSON `{ pl, uk }`. Both locales optional. */
const localized = z
  .object({
    pl: z.string().max(500).optional(),
    uk: z.string().max(500).optional(),
  })
  .strict();

const nullableCuid = z.string().min(1).nullable().optional();

export const createPromoBannerSchema = z.object({
  body: z.object({
    title: localized.optional(),
    subtitle: localized.optional(),
    ctaLabel: localized.optional(),
    image: z.string().min(1),
    productId: nullableCuid,
    categoryId: nullableCuid,
    href: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    position: z.number().int().optional(),
  }),
});

export const updatePromoBannerSchema = z.object({
  body: z.object({
    title: localized.optional(),
    subtitle: localized.optional(),
    ctaLabel: localized.optional(),
    image: z.string().min(1).optional(),
    productId: nullableCuid,
    categoryId: nullableCuid,
    href: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    position: z.number().int().optional(),
  }),
});
