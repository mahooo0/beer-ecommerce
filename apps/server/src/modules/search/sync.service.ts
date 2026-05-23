import { prisma } from '@repo/db';
import type { SearchDocument } from './types.js';
import { searchService } from './search.service.js';
import { eventBus } from '../../common/events/event-bus.js';

const BATCH_SIZE = 10000;

export class SyncService {
  buildSearchDocument(product: any): SearchDocument {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price,
      images: product.images,
      status: product.status,
      productType: product.productType,
      brandId: product.brandId,
      brandName: product.brand?.name || null,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      categoryPath: product.category.path,
      createdAt: new Date(product.createdAt).getTime(),
      updatedAt: new Date(product.updatedAt).getTime(),
    };
  }

  async indexProduct(productId: string): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        brand: true,
      },
    });

    if (!product) {
      return;
    }

    // Skip non-active products (delete from index instead)
    if (product.status !== 'ACTIVE') {
      await this.deleteProduct(productId);
      return;
    }

    const searchDocument = this.buildSearchDocument(product);
    await searchService.addDocuments([searchDocument]);
  }

  async deleteProduct(productId: string): Promise<void> {
    await searchService.deleteDocument(productId);
  }

  async fullSync(): Promise<void> {
    let cursor: string | undefined = undefined;
    let processedCount = 0;

    console.log('Starting full product sync to Meilisearch...');

    while (true) {
      const products = await prisma.product.findMany({
        take: BATCH_SIZE,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        where: {
          status: 'ACTIVE',
        },
        include: {
          category: true,
          brand: true,
        },
        orderBy: {
          id: 'asc',
        },
      });

      if (products.length === 0) {
        break;
      }

      const searchDocuments = products.map((product) => this.buildSearchDocument(product));
      await searchService.addDocuments(searchDocuments);

      processedCount += products.length;
      console.log(`Synced ${processedCount} products...`);

      if (products.length < BATCH_SIZE) {
        break;
      }

      cursor = products[products.length - 1].id;
    }

    console.log(`Full sync complete. Total products synced: ${processedCount}`);
  }

  registerEventListeners(): void {
    eventBus.on('product.created', (data) => {
      this.indexProduct(data.productId).catch((err) => {
        console.error('Search index failed for product.created:', err);
      });
    });

    eventBus.on('product.updated', (data) => {
      this.indexProduct(data.productId).catch((err) => {
        console.error('Search index failed for product.updated:', err);
      });
    });

    eventBus.on('product.deleted', (data) => {
      this.deleteProduct(data.productId).catch((err) => {
        console.error('Search index failed for product.deleted:', err);
      });
    });
  }
}

export const syncService = new SyncService();

// Register event listeners on module load
syncService.registerEventListeners();
