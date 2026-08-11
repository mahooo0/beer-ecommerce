import { z } from 'zod';
import { productSchema, updateProductSchema } from '@repo/types/product-schemas';

// Filter query schema for GET /products/filter and GET /products/facets
export const filterQuerySchema = z.object({
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  // Free-text product-name search, so the main catalog can combine search + filters.
  search: z.string().optional(),
  brands: z.string().optional(), // comma-separated brand IDs
  attributes: z.string().optional(), // comma-separated "key:value" pairs (legacy JSONB)
  // Normalized attribute-value filter: comma-separated AttributeValue ids.
  // Matches products via the ProductAttributeValue junction.
  attributeValues: z.string().optional(),
  availability: z.string().optional(), // comma-separated: "in_stock", "out_of_stock", "pre_order"
  // Manual in/out-of-stock flag filter ("true"/"false").
  isAvailable: z
    .enum(['true', 'false'])
    .optional()
    .transform((v: 'true' | 'false' | undefined) => (v === undefined ? undefined : v === 'true')),
  categoryId: z.string().optional(),
  categoryPath: z.string().optional(),
  // Status filter. Admin passes DRAFT/ACTIVE/ARCHIVED to narrow, or 'ALL' to see
  // every status; when omitted the list defaults to ACTIVE (storefront-safe).
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'ALL']).optional(),
  // In-memory completeness bucketing after fetch.
  completenessFilter: z.enum(['complete', 'incomplete']).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Request validation schemas for Express middleware
// The validate middleware expects schemas that wrap req.body, req.query, req.params

export const createProductSchema = z.object({
  body: productSchema,
});

export const updateProductRequestSchema = z.object({
  body: updateProductSchema,
  params: z.object({
    id: z.string(),
  }),
});

export const statusChangeSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export const bulkStatusSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'At least one product ID is required'),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  }),
});

export const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'At least one product ID is required'),
  }),
});

// Export shared schemas for direct use
export { productSchema, updateProductSchema };
