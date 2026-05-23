import { z } from 'zod';

// 1. Create Warehouse Schema
export const createWarehouseSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(20).toUpperCase(),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().length(2),
    zipCode: z.string().min(1),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    priority: z.number().int().default(0),
    isActive: z.boolean().default(true),
  }),
});

// 2. Update Warehouse Schema
export const updateWarehouseSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100),
      code: z.string().min(1).max(20).toUpperCase(),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      country: z.string().length(2),
      zipCode: z.string().min(1),
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
      priority: z.number().int(),
      isActive: z.boolean(),
    })
    .partial(),
});

// 3. Adjust Stock Schema
// NOTE: RESERVATION and RESERVATION_RELEASE are excluded — system-only reasons
export const adjustStockSchema = z.object({
  body: z.object({
    variantId: z.string().cuid(),
    warehouseId: z.string().cuid(),
    quantity: z.number().int(), // positive = add, negative = remove
    reason: z.enum(['SALE', 'RETURN', 'MANUAL_ADJUSTMENT', 'DAMAGE', 'RESTOCK']),
    note: z.string().max(500).optional(),
    reference: z.string().optional(),
  }),
});

// 4. Get Movements Schema
export const getMovementsSchema = z.object({
  query: z.object({
    inventoryItemId: z.string().optional(),
    reason: z
      .enum([
        'SALE',
        'RETURN',
        'MANUAL_ADJUSTMENT',
        'DAMAGE',
        'RESTOCK',
        'RESERVATION',
        'RESERVATION_RELEASE',
      ])
      .optional(),
    page: z.coerce.number().int().default(1),
    limit: z.coerce.number().int().default(50),
  }),
});

// 5. Reserve Stock Schema
export const reserveStockSchema = z.object({
  body: z.object({
    variantId: z.string().cuid(),
    warehouseId: z.string().cuid().optional(), // if omitted, auto-select best warehouse
    quantity: z.number().int().positive(),
    checkoutSessionId: z.string(),
  }),
});

// 6. Commit Reservation Schema
export const commitReservationSchema = z.object({
  body: z.object({
    checkoutSessionId: z.string(),
  }),
});

// 7. Release Reservation Schema
export const releaseReservationSchema = z.object({
  body: z.object({
    checkoutSessionId: z.string(),
  }),
});

// 8. Get Stock Schema
export const getStockSchema = z.object({
  query: z.object({
    variantId: z.string().optional(),
    warehouseId: z.string().optional(),
  }),
});
