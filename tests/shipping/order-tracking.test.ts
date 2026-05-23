import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('OrderService - Tracking (SHIP-04)', () => {
  describe('add tracking', () => {
    it.todo('adds carrier and tracking number to order shipping info');
    it.todo('updates order status from paid/processing to shipped');
    it.todo('pushes status history entry with tracking details');
    it.todo('emits order.shipped event');
    it.todo('rejects tracking for non-shippable order status');
    it.todo('rejects tracking for non-existent order');
    it.todo('requires both carrier and tracking number');
  });
});
