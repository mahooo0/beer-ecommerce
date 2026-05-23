import { z } from 'zod';

// Shipping Zone Schemas
export const createShippingZoneSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    countries: z.array(z.string().length(2)).min(1),
    states: z.array(z.string()).default([]),
    freeShippingThreshold: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().default(true),
  }),
});

export const updateShippingZoneSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100),
      countries: z.array(z.string().length(2)).min(1),
      states: z.array(z.string()),
      freeShippingThreshold: z.number().int().positive().nullable(),
      isActive: z.boolean(),
    })
    .partial(),
});

// Shipping Method Schemas
export const createShippingMethodSchema = z
  .object({
    body: z.object({
      zoneId: z.string(),
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      rateType: z.enum(['FLAT_RATE', 'WEIGHT_BASED', 'PRICE_BASED']),
      flatRate: z.number().int().positive().nullable().optional(),
      weightRate: z.number().int().positive().nullable().optional(),
      minWeight: z.number().positive().nullable().optional(),
      maxWeight: z.number().positive().nullable().optional(),
      priceThresholds: z.record(z.string(), z.number().int()).nullable().optional(),
      estimatedDaysMin: z.number().int().positive().nullable().optional(),
      estimatedDaysMax: z.number().int().positive().nullable().optional(),
      isActive: z.boolean().default(true),
      position: z.number().int().min(0).default(0),
    }),
  })
  .refine(
    (data) => {
      const { rateType, flatRate, weightRate, priceThresholds } = data.body;
      if (rateType === 'FLAT_RATE' && !flatRate) return false;
      if (rateType === 'WEIGHT_BASED' && !weightRate) return false;
      if (rateType === 'PRICE_BASED' && !priceThresholds) return false;
      return true;
    },
    {
      message: 'FLAT_RATE requires flatRate, WEIGHT_BASED requires weightRate, PRICE_BASED requires priceThresholds',
    }
  );

export const updateShippingMethodSchema = z
  .object({
    body: z
      .object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).nullable(),
        rateType: z.enum(['FLAT_RATE', 'WEIGHT_BASED', 'PRICE_BASED']),
        flatRate: z.number().int().positive().nullable(),
        weightRate: z.number().int().positive().nullable(),
        minWeight: z.number().positive().nullable(),
        maxWeight: z.number().positive().nullable(),
        priceThresholds: z.record(z.string(), z.number().int()).nullable(),
        estimatedDaysMin: z.number().int().positive().nullable(),
        estimatedDaysMax: z.number().int().positive().nullable(),
        isActive: z.boolean(),
        position: z.number().int().min(0),
      })
      .partial(),
  })
  .refine(
    (data) => {
      const { rateType, flatRate, weightRate, priceThresholds } = data.body;
      // Only validate if rateType is being updated
      if (!rateType) return true;
      if (rateType === 'FLAT_RATE' && !flatRate) return false;
      if (rateType === 'WEIGHT_BASED' && !weightRate) return false;
      if (rateType === 'PRICE_BASED' && !priceThresholds) return false;
      return true;
    },
    {
      message: 'FLAT_RATE requires flatRate, WEIGHT_BASED requires weightRate, PRICE_BASED requires priceThresholds',
    }
  );

// Rate Calculation Schema
export const calculateRateSchema = z.object({
  body: z.object({
    country: z.string().length(2),
    state: z.string().optional(),
    cartSubtotal: z.number().int().positive(),
    cartWeight: z.number().min(0),
  }),
});
