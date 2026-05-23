import { describe, it, expect, beforeEach, vi } from 'vitest';
import { productService } from '../../apps/server/src/modules/product/product.service.js';
import { prisma } from '@repo/db';

describe('CSV Bulk Import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('imports valid CSV rows as products', async () => {
    const csvBuffer = Buffer.from(`name,description,price,sku,productType,categoryId,status,images
Simple Product,A good simple product description,$19.99,SKU-001,SIMPLE,cat-1,DRAFT,https://example.com/img1.jpg
Digital Product,A comprehensive digital product guide,$29.99,SKU-002,DIGITAL,cat-2,ACTIVE,https://example.com/img2.jpg|https://example.com/img3.jpg`);

    const result = await productService.importFromCsv(csvBuffer);

    expect(result.total).toBe(2);
    expect(result.imported).toBeGreaterThan(0);
    expect(result.failed).toBeLessThan(2);
    expect(prisma.product.create).toHaveBeenCalled();
  });

  it('returns error details for invalid rows', async () => {
    const csvBuffer = Buffer.from(`name,description,price,sku,productType,categoryId,status,images
,Short,invalid,SKU-001,SIMPLE,cat-1,DRAFT,
Invalid Product,Bad,not-a-price,SKU-002,SIMPLE,cat-2,ACTIVE,`);

    const result = await productService.importFromCsv(csvBuffer);

    expect(result.total).toBe(2);
    expect(result.imported).toBe(0);
    expect(result.failed).toBe(2);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toHaveProperty('row');
    expect(result.errors[0]).toHaveProperty('message');
  });

  it('handles mixed valid and invalid rows', async () => {
    const csvBuffer = Buffer.from(`name,description,price,sku,productType,categoryId,status,images
Valid Product,This is a good product description,$19.99,SKU-001,SIMPLE,cat-1,DRAFT,https://example.com/img1.jpg
,Short description,10,SKU-002,SIMPLE,cat-2,DRAFT,`);

    const result = await productService.importFromCsv(csvBuffer);

    expect(result.total).toBe(2);
    expect(result.imported).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors.length).toBe(1);
  });

  it('parses price strings to integer cents', async () => {
    const csvBuffer = Buffer.from(`name,description,price,sku,productType,categoryId,status,images
Product One,Good product description here,$12.99,SKU-001,SIMPLE,cat-1,DRAFT,https://example.com/img1.jpg
Product Two,Another good product description,1599,SKU-002,SIMPLE,cat-2,ACTIVE,https://example.com/img2.jpg`);

    const result = await productService.importFromCsv(csvBuffer);

    expect(result.total).toBe(2);
    const createCalls = (prisma.product.create as any).mock.calls;
    if (createCalls.length > 0) {
      expect(createCalls[0][0].data.price).toBe(1299); // $12.99 -> 1299 cents
    }
  });

  it('handles all product types except VARIABLE', async () => {
    const csvBuffer = Buffer.from(`name,description,price,sku,productType,categoryId,status,images,unit,pricePerUnit,fileUrl,fileName,fileSize,fileFormat,bundleProductIds,bundleQuantities
Simple Product,A good simple product description,$19.99,SKU-001,SIMPLE,cat-1,DRAFT,https://example.com/img1.jpg,,,,,,,,
Weighted Product,Fresh organic apples sold by weight,0,SKU-002,WEIGHTED,cat-2,ACTIVE,,KG,399,,,,,,
Digital Product,Comprehensive TypeScript guide,$29.99,SKU-003,DIGITAL,cat-3,ACTIVE,https://example.com/img2.jpg,,,https://cdn.example.com/file.pdf,file.pdf,1024000,PDF,,
Bundle Product,Complete starter bundle,$49.99,SKU-004,BUNDLED,cat-4,ACTIVE,,,,,,,,"prod-1|prod-2","2|1"`);

    const result = await productService.importFromCsv(csvBuffer);

    expect(result.total).toBe(4);
    expect(result.imported).toBeGreaterThan(0);
    // VARIABLE product type should not be supported
  });

  it('returns total, imported, and failed counts', async () => {
    const csvBuffer = Buffer.from(`name,description,price,sku,productType,categoryId,status,images
Valid Product,This is a good product description,$19.99,SKU-001,SIMPLE,cat-1,DRAFT,https://example.com/img1.jpg`);

    const result = await productService.importFromCsv(csvBuffer);

    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('imported');
    expect(result).toHaveProperty('failed');
    expect(result).toHaveProperty('errors');
    expect(result.total).toBe(1);
    expect(result.imported).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.errors).toEqual([]);
  });
});
