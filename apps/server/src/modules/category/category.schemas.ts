import { z } from 'zod';

// Create category schema
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    image: z.string().url().optional(),
    parentId: z.string().optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    position: z.number().int().min(0).default(0),
  }),
});

// Update category schema
export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    position: z.number().int().min(0).optional(),
  }),
});

// Move category schema
export const moveCategorySchema = z.object({
  body: z.object({
    newParentId: z.string().nullable(),
    position: z.number().int().min(0),
  }),
});

// Create category attribute schema
export const createCategoryAttributeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    key: z.string().regex(/^[a-z_][a-z0-9_]*$/),
    type: z.enum(['SELECT', 'RANGE', 'BOOLEAN', 'TEXT']),
    values: z.array(z.string()).optional(),
    unit: z.string().optional(),
    isFilterable: z.boolean().default(true),
    isRequired: z.boolean().default(false),
    position: z.number().int().min(0).default(0),
  }).refine(
    (data) => {
      // If type is SELECT, values must be a non-empty array
      if (data.type === 'SELECT') {
        return data.values && data.values.length > 0;
      }
      return true;
    },
    {
      message: 'SELECT type requires a non-empty values array',
      path: ['values'],
    }
  ),
});

// Update category attribute schema
export const updateCategoryAttributeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    key: z.string().regex(/^[a-z_][a-z0-9_]*$/).optional(),
    type: z.enum(['SELECT', 'RANGE', 'BOOLEAN', 'TEXT']).optional(),
    values: z.array(z.string()).optional(),
    unit: z.string().optional(),
    isFilterable: z.boolean().optional(),
    isRequired: z.boolean().optional(),
    position: z.number().int().min(0).optional(),
  }).refine(
    (data) => {
      // If type is SELECT, values must be a non-empty array
      if (data.type === 'SELECT') {
        return data.values && data.values.length > 0;
      }
      return true;
    },
    {
      message: 'SELECT type requires a non-empty values array',
      path: ['values'],
    }
  ),
});
