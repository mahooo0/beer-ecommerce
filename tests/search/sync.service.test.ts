import { describe, it } from 'vitest';

describe('SyncService', () => {
  describe('indexProduct', () => {
    it.todo('should build search document from product with relations');
    it.todo('should add document to Meilisearch index');
    it.todo('should handle products without brand gracefully');
  });

  describe('deleteProduct', () => {
    it.todo('should delete document from Meilisearch index by id');
  });

  describe('fullSync', () => {
    it.todo('should fetch all active products in batches of 10000');
    it.todo('should build search documents and add to index in batch');
    it.todo('should only sync ACTIVE products');
  });

  describe('event listeners', () => {
    it.todo('should sync product on product.created event');
    it.todo('should sync product on product.updated event');
    it.todo('should delete from index on product.deleted event');
  });
});
