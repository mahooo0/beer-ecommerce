import { describe, it, expect } from 'vitest';
import { productSchema } from '../../packages/types/src/product-schemas.js';

describe('Product Schema - DIGITAL type', () => {
  it('validates DIGITAL product with digitalMeta including fileUrl', () => {
    const digitalProduct = {
      productType: 'DIGITAL',
      name: 'E-Book: Advanced TypeScript',
      description: 'Comprehensive guide to advanced TypeScript patterns',
      price: 4999,
      categoryId: 'cat_123',
      sku: 'EBOOK-TS-001',
      images: ['https://example.com/cover.jpg'],
      status: 'DRAFT',
      isActive: true,
      attributes: {},
      digitalMeta: {
        fileUrl: 'https://cloudinary.com/files/ebook-typescript.pdf',
        fileName: 'advanced-typescript.pdf',
        fileSize: 5242880, // 5MB in bytes
        fileFormat: 'pdf',
        maxDownloads: 5,
        accessDuration: 30, // 30 days
      },
    };

    const result = productSchema.safeParse(digitalProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productType).toBe('DIGITAL');
      expect(result.data.digitalMeta.fileUrl).toBe('https://cloudinary.com/files/ebook-typescript.pdf');
      expect(result.data.digitalMeta.fileName).toBe('advanced-typescript.pdf');
      expect(result.data.digitalMeta.fileSize).toBe(5242880);
    }
  });

  it('validates DIGITAL product with unlimited downloads and lifetime access', () => {
    const digitalProduct = {
      productType: 'DIGITAL',
      name: 'Music Track',
      description: 'High quality music track with lifetime access',
      price: 999,
      categoryId: 'cat_123',
      sku: 'MUSIC-001',
      digitalMeta: {
        fileUrl: 'https://cloudinary.com/files/track.mp3',
        fileName: 'awesome-track.mp3',
        fileSize: 8388608, // 8MB
        fileFormat: 'mp3',
      },
    };

    const result = productSchema.safeParse(digitalProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.digitalMeta.maxDownloads).toBeUndefined();
      expect(result.data.digitalMeta.accessDuration).toBeUndefined();
    }
  });

  it('rejects DIGITAL product with invalid fileUrl', () => {
    const invalidProduct = {
      productType: 'DIGITAL',
      name: 'Invalid Digital Product',
      description: 'Digital product with invalid URL',
      price: 1999,
      categoryId: 'cat_123',
      sku: 'INVALID-002',
      digitalMeta: {
        fileUrl: 'not-a-valid-url',
        fileName: 'file.pdf',
        fileSize: 1000,
        fileFormat: 'pdf',
      },
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('rejects DIGITAL product with negative fileSize', () => {
    const invalidProduct = {
      productType: 'DIGITAL',
      name: 'Invalid Digital Product',
      description: 'Digital product with negative file size',
      price: 1999,
      categoryId: 'cat_123',
      sku: 'INVALID-003',
      digitalMeta: {
        fileUrl: 'https://cloudinary.com/file.pdf',
        fileName: 'file.pdf',
        fileSize: -1000,
        fileFormat: 'pdf',
      },
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });
});
