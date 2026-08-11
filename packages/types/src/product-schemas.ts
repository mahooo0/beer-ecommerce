import { z } from 'zod';

// ============================================================================
// FLAT PRODUCT SCHEMA
// ----------------------------------------------------------------------------
// The former 4fr-style `productType` discriminated union (SIMPLE / VARIABLE /
// WEIGHTED / DIGITAL / BUNDLED) has been collapsed into a single flat schema.
// Taranka has NO product variants: variant / weighted / digital / bundled DB
// columns are kept but never required or written by the create/update paths.
// IDs are cuid strings — never coerced with Number()/parseInt().
// ============================================================================

// A single attribute-value selection (normalized ProductAttributeValue junction).
export const productAttributeValueInputSchema = z.object({
  attributeId: z.string().min(1, 'attributeId is required'),
  attributeValueId: z.string().min(1, 'attributeValueId is required'),
});

export type ProductAttributeValueInput = z.infer<typeof productAttributeValueInputSchema>;

// ----------------------------------------------------------------------------
// WHOLESALE QUANTITY PRICING ("оптовая цена")
// ----------------------------------------------------------------------------
// A tier says: buy at least `minQty` units and the whole lot costs `price`
// (integer cents) — i.e. `price` is the TOTAL for `minQty` units, from which a
// per-unit rate is derived. Tiers apply ONLY to WHOLESALE customers; retail
// always pays the regular unit price. Stored on Product.wholesaleTiers (JSON).
export const wholesaleTierSchema = z.object({
  minQty: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
  // Total price (cents) for `minQty` units.
  price: z.number().int('Price must be an integer (cents)').positive('Price must be positive'),
});

export type WholesaleTier = z.infer<typeof wholesaleTierSchema>;

/**
 * Effective per-unit price (cents) for a given quantity.
 * - Retail customers (isWholesale=false) always get `basePrice`.
 * - Wholesale customers get the highest tier whose `minQty` ≤ quantity; the
 *   per-unit rate is `tier.price / tier.minQty`. Below the smallest tier they
 *   still pay `basePrice`.
 */
export function resolveWholesaleUnitPrice(opts: {
  basePrice: number; // retail unit price, cents (salePrice ?? price)
  tiers?: WholesaleTier[] | null;
  quantity: number;
  isWholesale: boolean;
}): number {
  const { basePrice, tiers, quantity, isWholesale } = opts;
  if (!isWholesale || !tiers?.length || quantity <= 0) return basePrice;
  const applicable = tiers
    .filter((t) => t.minQty > 0 && t.price > 0 && quantity >= t.minQty)
    .sort((a, b) => a.minQty - b.minQty)
    .pop();
  if (!applicable) return basePrice;
  return Math.round(applicable.price / applicable.minQty);
}

/** Line total (cents) = effective unit price × quantity. */
export function resolveWholesaleLineTotal(opts: {
  basePrice: number;
  tiers?: WholesaleTier[] | null;
  quantity: number;
  isWholesale: boolean;
}): number {
  return resolveWholesaleUnitPrice(opts) * opts.quantity;
}

/** Tiers sorted ascending by minQty, with per-unit rate derived — for display. */
export function sortedWholesaleTiers(
  tiers?: WholesaleTier[] | null,
): Array<WholesaleTier & { unitPrice: number }> {
  return (tiers ?? [])
    .filter((t) => t.minQty > 0 && t.price > 0)
    .slice()
    .sort((a, b) => a.minQty - b.minQty)
    .map((t) => ({ ...t, unitPrice: Math.round(t.price / t.minQty) }));
}

// Flat product schema — all fields on one object (no discriminated union).
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  // Prices are integer cents. `price` is the regular price ("цена"), `salePrice`
  // is the optional active discount ("цена со скидкой"). Both are ceil'd to whole
  // currency units in the service.
  price: z.number().int('Price must be an integer (cents)').positive('Price must be positive'),
  salePrice: z
    .number()
    .int('Sale price must be an integer (cents)')
    .positive('Sale price must be positive')
    .nullable()
    .optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  images: z.array(z.string().url()).default([]),
  // Optional: auto-generated server-side when omitted (sku is @unique + required).
  sku: z.string().min(1).optional(),
  // Explicit slug override; when omitted the service derives it from `name`.
  slug: z.string().optional(),
  // New catalog fields.
  baseUnit: z.string().default('piece'),
  manufacturer: z.string().optional(),
  composition: z.string().optional(),
  searchKeywords: z.array(z.string()).default([]),
  // Wholesale quantity pricing tiers (opt). Applied only to WHOLESALE buyers.
  // Preprocess drops blank/incomplete rows the admin form may leave behind so
  // they never fail validation — only fully-filled tiers are kept & validated.
  wholesaleTiers: z
    .preprocess(
      (v) =>
        Array.isArray(v)
          ? v.filter(
              (t) =>
                t != null && Number((t as any).minQty) > 0 && Number((t as any).price) > 0,
            )
          : v,
      z.array(wholesaleTierSchema).default([]),
    )
    .default([]),
  // Dual-mode stock.
  trackQuantity: z.boolean().default(false),
  quantity: z.number().int('Quantity must be an integer').nonnegative('Quantity cannot be negative').default(0),
  isAvailable: z.boolean().default(true),
  isActive: z.boolean().default(true),
  // Legacy JSONB dynamic attributes (superseded by attributeValues; still accepted).
  attributes: z.record(z.string(), z.any()).default({}),
  // Normalized per-category attribute-value selections.
  attributeValues: z.array(productAttributeValueInputSchema).optional(),
  // Taxonomy join tables (kept from base; optional).
  tagIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
});

// Infer TypeScript type from schema.
export type ProductFormData = z.infer<typeof productSchema>;

// Update schema — every field optional; `price` re-added as optional because
// `.partial()` alone keeps its `.positive()` refinement but makes it optional.
export const updateProductSchema = productSchema.partial();

export type ProductUpdateData = z.infer<typeof updateProductSchema>;
