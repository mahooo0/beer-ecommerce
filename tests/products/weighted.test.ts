import { describe, it, expect } from 'vitest';
import { productSchema } from '../../packages/types/src/product-schemas.js';

describe('Product Schema - WEIGHTED type', () => {
  it('validates WEIGHTED product with weightedMeta', () => {
    const weightedProduct = {
      productType: 'WEIGHTED',
      name: 'Organic Coffee Beans',
      description: 'Premium organic coffee beans sold by weight',
      price: 0, // base price not used for weighted
      categoryId: 'cat_123',
      sku: 'COFFEE-001',
      images: [],
      status: 'DRAFT',
      isActive: true,
      attributes: {},
      weightedMeta: {
        unit: 'KG',
        pricePerUnit: 1500, // cents per kg
        minWeight: 0.1,
        maxWeight: 5.0,
        stepWeight: 0.1,
      },
    };

    const result = productSchema.safeParse(weightedProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productType).toBe('WEIGHTED');
      expect(result.data.weightedMeta.unit).toBe('KG');
      expect(result.data.weightedMeta.pricePerUnit).toBe(1500);
    }
  });

  it('validates WEIGHTED product with minimal weightedMeta', () => {
    const weightedProduct = {
      productType: 'WEIGHTED',
      name: 'Bulk Rice',
      description: 'Premium long grain rice sold by weight',
      price: 0,
      categoryId: 'cat_123',
      sku: 'RICE-001',
      weightedMeta: {
        unit: 'LB',
        pricePerUnit: 500, // cents per lb
      },
    };

    const result = productSchema.safeParse(weightedProduct);
    expect(result.success).toBe(true);
  });

  it('validates WEIGHTED product with different units', () => {
    const units = ['KG', 'LB', 'OZ', 'G'];

    units.forEach((unit) => {
      const weightedProduct = {
        productType: 'WEIGHTED',
        name: 'Test Product',
        description: 'Test product with different unit',
        price: 0,
        categoryId: 'cat_123',
        sku: `TEST-${unit}`,
        weightedMeta: {
          unit,
          pricePerUnit: 1000,
        },
      };

      const result = productSchema.safeParse(weightedProduct);
      expect(result.success).toBe(true);
    });
  });

  it('rejects WEIGHTED product with negative pricePerUnit', () => {
    const invalidProduct = {
      productType: 'WEIGHTED',
      name: 'Invalid Product',
      description: 'Product with negative price per unit',
      price: 0,
      categoryId: 'cat_123',
      sku: 'INVALID-002',
      weightedMeta: {
        unit: 'KG',
        pricePerUnit: -100,
      },
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });
});
