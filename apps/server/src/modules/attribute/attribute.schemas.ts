import { z } from 'zod';

// NOTE (taranka adaptation): all IDs are cuid strings — 4fr used numeric
// categoryId and uuid value ids. We drop every Number()/parseInt coercion and
// treat every id as a plain non-empty string.

const displayTypeEnum = z.enum(['checkbox', 'select', 'button', 'color', 'range']);

// ========================================
// ATTRIBUTE CRUD
// ========================================

// `name` (the snake_case machine slug) is optional on create — the service
// derives it from `displayName` (transliterating Cyrillic) when omitted.
export const createAttributeSchema = z.object({
  body: z.object({
    categoryId: z.string().min(1),
    name: z.string().min(1).optional(),
    displayName: z.string().min(1, 'Display name is required'),
    isFilterable: z.boolean().optional(),
    isVisibleOnProductPage: z.boolean().optional(),
    usedForVariations: z.boolean().optional(),
    showValueIcons: z.boolean().optional(),
    displayType: displayTypeEnum.optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateAttributeSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    isFilterable: z.boolean().optional(),
    isVisibleOnProductPage: z.boolean().optional(),
    usedForVariations: z.boolean().optional(),
    showValueIcons: z.boolean().optional(),
    displayType: displayTypeEnum.optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

// ========================================
// ATTRIBUTE VALUE CRUD (the "common option / общая опция")
// ========================================

export const createAttributeValueSchema = z.object({
  body: z.object({
    attributeId: z.string().min(1),
    value: z.string().min(1, 'Value is required'),
    displayValue: z.string().optional(),
    colorCode: z.string().optional(),
    iconUrl: z.string().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateAttributeValueSchema = z.object({
  body: z.object({
    value: z.string().min(1).optional(),
    displayValue: z.string().nullable().optional(),
    colorCode: z.string().nullable().optional(),
    iconUrl: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

// ========================================
// BULK REORDER (drag-and-drop) — array of { id, sortOrder }
// ========================================

export const reorderAttributesSchema = z.object({
  body: z.array(z.object({ id: z.string().min(1), sortOrder: z.number().int() })),
});

export const reorderAttributeValuesSchema = z.object({
  body: z.array(z.object({ id: z.string().min(1), sortOrder: z.number().int() })),
});

// ========================================
// PRODUCT ATTRIBUTE VALUES (bulk set)
// ========================================

export const setProductAttributeValuesSchema = z.object({
  body: z.object({
    values: z.array(
      z.object({
        attributeId: z.string().min(1),
        attributeValueId: z.string().min(1),
      })
    ),
  }),
});
