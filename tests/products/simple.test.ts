import { describe, it, expect } from 'vitest';
import { productSchema } from '../../packages/types/src/product-schemas.js';

describe('Product Schema - SIMPLE type', () => {
  it('validates SIMPLE product with base fields only', () => {
    const simpleProduct = {
      productType: 'SIMPLE',
      name: 'Basic T-Shirt',
      description: 'A comfortable cotton t-shirt for everyday wear',
      price: 2999, // cents
      categoryId: 'cat_123',
      sku: 'TSHIRT-001',
      images: [],
      status: 'DRAFT',
      isActive: true,
      attributes: {},
    };

    const result = productSchema.safeParse(simpleProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productType).toBe('SIMPLE');
      expect(result.data.name).toBe('Basic T-Shirt');
      expect(result.data.price).toBe(2999);
    }
  });

  it('validates SIMPLE product with optional fields', () => {
    const simpleProduct = {
      productType: 'SIMPLE',
      name: 'Premium T-Shirt',
      description: 'A premium quality cotton t-shirt',
      price: 4999,
      compareAtPrice: 6999,
      categoryId: 'cat_123',
      brandId: 'brand_456',
      sku: 'TSHIRT-002',
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      status: 'ACTIVE',
      isActive: true,
      attributes: { color: 'blue', size: 'M' },
      tagIds: ['tag_1', 'tag_2'],
      collectionIds: ['col_1'],
    };

    const result = productSchema.safeParse(simpleProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.compareAtPrice).toBe(6999);
      expect(result.data.brandId).toBe('brand_456');
      expect(result.data.tagIds).toHaveLength(2);
    }
  });

  it('rejects SIMPLE product with invalid price (non-integer)', () => {
    const invalidProduct = {
      productType: 'SIMPLE',
      name: 'Basic T-Shirt',
      description: 'A comfortable cotton t-shirt',
      price: 29.99, // should be integer (cents)
      categoryId: 'cat_123',
      sku: 'TSHIRT-001',
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('rejects SIMPLE product with short description', () => {
    const invalidProduct = {
      productType: 'SIMPLE',
      name: 'T-Shirt',
      description: 'Short', // less than 10 chars
      price: 2999,
      categoryId: 'cat_123',
      sku: 'TSHIRT-001',
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('rejects SIMPLE product with empty name', () => {
    const invalidProduct = {
      productType: 'SIMPLE',
      name: '',
      description: 'A comfortable cotton t-shirt',
      price: 2999,
      categoryId: 'cat_123',
      sku: 'TSHIRT-001',
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('rejects SIMPLE product with negative price', () => {
    const invalidProduct = {
      productType: 'SIMPLE',
      name: 'T-Shirt',
      description: 'A comfortable cotton t-shirt',
      price: -100,
      categoryId: 'cat_123',
      sku: 'TSHIRT-001',
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });
});
