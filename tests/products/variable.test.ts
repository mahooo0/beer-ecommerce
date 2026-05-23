import { describe, it, expect } from 'vitest';
import { productSchema } from '../../packages/types/src/product-schemas.js';

describe('Product Schema - VARIABLE type', () => {
  it('validates VARIABLE product requiring at least 1 variant', () => {
    const variableProduct = {
      productType: 'VARIABLE',
      name: 'Variable T-Shirt',
      description: 'T-shirt available in multiple sizes and colors',
      price: 2999,
      categoryId: 'cat_123',
      sku: 'TSHIRT-VAR-001',
      images: [],
      status: 'DRAFT',
      isActive: true,
      attributes: {},
      variants: [
        {
          sku: 'TSHIRT-VAR-001-S-RED',
          price: 2999,
          stock: 10,
          isActive: true,
          images: [],
          options: [
            { groupId: 'size_group', valueId: 'size_small' },
            { groupId: 'color_group', valueId: 'color_red' },
          ],
        },
      ],
    };

    const result = productSchema.safeParse(variableProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productType).toBe('VARIABLE');
      expect(result.data.variants).toHaveLength(1);
      expect(result.data.variants[0].sku).toBe('TSHIRT-VAR-001-S-RED');
    }
  });

  it('validates VARIABLE product with multiple variants', () => {
    const variableProduct = {
      productType: 'VARIABLE',
      name: 'Variable T-Shirt',
      description: 'T-shirt available in multiple sizes and colors',
      price: 2999,
      categoryId: 'cat_123',
      sku: 'TSHIRT-VAR-001',
      variants: [
        {
          sku: 'TSHIRT-VAR-001-S-RED',
          price: 2999,
          stock: 10,
          isActive: true,
          options: [
            { groupId: 'size_group', valueId: 'size_small' },
            { groupId: 'color_group', valueId: 'color_red' },
          ],
        },
        {
          sku: 'TSHIRT-VAR-001-M-BLUE',
          price: 3199,
          stock: 5,
          isActive: true,
          options: [
            { groupId: 'size_group', valueId: 'size_medium' },
            { groupId: 'color_group', valueId: 'color_blue' },
          ],
        },
      ],
    };

    const result = productSchema.safeParse(variableProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variants).toHaveLength(2);
    }
  });

  it('rejects VARIABLE product with 0 variants', () => {
    const invalidProduct = {
      productType: 'VARIABLE',
      name: 'Variable T-Shirt',
      description: 'T-shirt with no variants',
      price: 2999,
      categoryId: 'cat_123',
      sku: 'TSHIRT-VAR-001',
      variants: [],
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('rejects VARIABLE product with variant with negative stock', () => {
    const invalidProduct = {
      productType: 'VARIABLE',
      name: 'Variable T-Shirt',
      description: 'T-shirt with invalid stock',
      price: 2999,
      categoryId: 'cat_123',
      sku: 'TSHIRT-VAR-001',
      variants: [
        {
          sku: 'TSHIRT-VAR-001-S-RED',
          price: 2999,
          stock: -5,
          isActive: true,
          options: [{ groupId: 'size_group', valueId: 'size_small' }],
        },
      ],
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });
});
