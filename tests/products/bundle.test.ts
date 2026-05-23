import { describe, it, expect } from 'vitest';
import { productSchema } from '../../packages/types/src/product-schemas.js';

describe('Product Schema - BUNDLED type', () => {
  it('validates BUNDLED product requiring at least 2 items', () => {
    const bundledProduct = {
      productType: 'BUNDLED',
      name: 'Starter Kit',
      description: 'Complete starter kit with essential items',
      price: 9999,
      categoryId: 'cat_123',
      sku: 'BUNDLE-STARTER-001',
      images: [],
      status: 'DRAFT',
      isActive: true,
      attributes: {},
      bundleItems: [
        {
          productId: 'prod_item1',
          quantity: 1,
          discount: 500, // 5 dollars off
        },
        {
          productId: 'prod_item2',
          quantity: 2,
          discount: 0,
        },
      ],
    };

    const result = productSchema.safeParse(bundledProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productType).toBe('BUNDLED');
      expect(result.data.bundleItems).toHaveLength(2);
      expect(result.data.bundleItems[0].productId).toBe('prod_item1');
    }
  });

  it('validates BUNDLED product with default quantity and discount', () => {
    const bundledProduct = {
      productType: 'BUNDLED',
      name: 'Simple Bundle',
      description: 'Simple bundle with default values',
      price: 5999,
      categoryId: 'cat_123',
      sku: 'BUNDLE-SIMPLE-001',
      bundleItems: [
        { productId: 'prod_1' }, // should default to quantity: 1, discount: 0
        { productId: 'prod_2' },
      ],
    };

    const result = productSchema.safeParse(bundledProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bundleItems[0].quantity).toBe(1);
      expect(result.data.bundleItems[0].discount).toBe(0);
    }
  });

  it('rejects BUNDLED product with 1 item', () => {
    const invalidProduct = {
      productType: 'BUNDLED',
      name: 'Invalid Bundle',
      description: 'Bundle with only one item',
      price: 5999,
      categoryId: 'cat_123',
      sku: 'BUNDLE-INVALID-001',
      bundleItems: [
        {
          productId: 'prod_1',
          quantity: 1,
          discount: 0,
        },
      ],
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('rejects BUNDLED product with negative discount', () => {
    const invalidProduct = {
      productType: 'BUNDLED',
      name: 'Invalid Bundle',
      description: 'Bundle with negative discount',
      price: 5999,
      categoryId: 'cat_123',
      sku: 'BUNDLE-INVALID-005',
      bundleItems: [
        { productId: 'prod_1', quantity: 1, discount: -100 },
        { productId: 'prod_2', quantity: 1, discount: 0 },
      ],
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });
});
