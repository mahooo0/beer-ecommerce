import { z } from 'zod';

// Base product schema with all common fields
const baseProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().int('Price must be an integer (cents)').positive('Price must be positive'),
  compareAtPrice: z.number().int('Compare price must be an integer').positive().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  images: z.array(z.string().url()).default([]),
  sku: z.string().min(1, 'SKU is required'),
  attributes: z.record(z.string(), z.any()).default({}),
  isActive: z.boolean().default(true),
  tagIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
});

// SIMPLE product - just the base fields
const simpleProductSchema = baseProductSchema.extend({
  productType: z.literal('SIMPLE'),
});

// VARIABLE product - requires variants with options
const variantSchema = z.object({
  sku: z.string().min(1, 'Variant SKU is required'),
  price: z.number().int().positive('Variant price must be positive'),
  stock: z.number().int().nonnegative('Stock cannot be negative').default(0),
  isActive: z.boolean().default(true),
  images: z.array(z.string().url()).optional(),
  options: z.array(
    z.object({
      groupId: z.string(),
      valueId: z.string(),
    })
  ),
});

const variableProductSchema = baseProductSchema.extend({
  productType: z.literal('VARIABLE'),
  variants: z.array(variantSchema).min(1, 'Variable product must have at least 1 variant'),
});

// WEIGHTED product - requires weight-based pricing metadata
const weightedMetaSchema = z.object({
  unit: z.enum(['KG', 'LB', 'OZ', 'G']),
  pricePerUnit: z.number().int().positive('Price per unit must be positive'),
  minWeight: z.number().positive().optional(),
  maxWeight: z.number().positive().optional(),
  stepWeight: z.number().positive().optional(),
});

const weightedProductSchema = baseProductSchema
  .omit({ price: true })
  .extend({
    productType: z.literal('WEIGHTED'),
    price: z.number().int('Price must be an integer (cents)').nonnegative('Price must be non-negative'),
    weightedMeta: weightedMetaSchema,
  });

// DIGITAL product - requires digital file metadata
const digitalMetaSchema = z.object({
  fileUrl: z.string().url('File URL must be valid'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  fileFormat: z.string().min(1, 'File format is required'),
  maxDownloads: z.number().int().positive().optional(),
  accessDuration: z.number().int().positive().optional(),
});

const digitalProductSchema = baseProductSchema.extend({
  productType: z.literal('DIGITAL'),
  digitalMeta: digitalMetaSchema,
});

// BUNDLED product - requires at least 2 bundled items
const bundleItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive().default(1),
  discount: z.number().int().nonnegative('Discount cannot be negative').default(0),
});

const bundledProductSchema = baseProductSchema.extend({
  productType: z.literal('BUNDLED'),
  bundleItems: z.array(bundleItemSchema).min(2, 'Bundle must contain at least 2 items'),
});

// Discriminated union of all product types
export const productSchema = z.discriminatedUnion('productType', [
  simpleProductSchema,
  variableProductSchema,
  weightedProductSchema,
  digitalProductSchema,
  bundledProductSchema,
]);

// Infer TypeScript type from schema
export type ProductFormData = z.infer<typeof productSchema>;

// Update schema - partial version of base fields, type-specific fields optional
// Note: productType cannot be changed after creation
const baseUpdateSchema = baseProductSchema.partial().omit({ price: true }).extend({
  price: z.number().int().positive().optional(),
});

export const updateProductSchema = z.union([
  baseUpdateSchema.extend({
    productType: z.literal('SIMPLE').optional(),
  }),
  baseUpdateSchema.extend({
    productType: z.literal('VARIABLE').optional(),
    variants: z.array(variantSchema).min(1).optional(),
  }),
  baseUpdateSchema.extend({
    productType: z.literal('WEIGHTED').optional(),
    weightedMeta: weightedMetaSchema.optional(),
  }),
  baseUpdateSchema.extend({
    productType: z.literal('DIGITAL').optional(),
    digitalMeta: digitalMetaSchema.optional(),
  }),
  baseUpdateSchema.extend({
    productType: z.literal('BUNDLED').optional(),
    bundleItems: z.array(bundleItemSchema).min(2).optional(),
  }),
]);

export type ProductUpdateData = z.infer<typeof updateProductSchema>;
