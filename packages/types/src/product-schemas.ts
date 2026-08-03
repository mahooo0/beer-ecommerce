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
