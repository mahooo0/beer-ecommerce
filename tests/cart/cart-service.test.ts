import { describe, it } from 'vitest';

// Stubs for CartService tests - CART-01, CART-03, CART-05
// Implementations will be added in subsequent plans

describe('CartService', () => {
  describe('getOrCreateCart', () => {
    it.todo('creates new cart if none exists for userId');
  });

  describe('addItem', () => {
    it.todo('adds item to cart');
    it.todo('increments quantity if item already exists');
    it.todo('stores price snapshot from product at add-time');
  });

  describe('updateQuantity', () => {
    it.todo('updates item quantity');
    it.todo('clamps quantity to available stock');
  });

  describe('removeItem', () => {
    it.todo('removes item by productId + variantId');
  });

  describe('clearCart', () => {
    it.todo('removes all items from cart');
  });

  describe('mergeGuestCart', () => {
    it.todo('sums quantities for matching items capped at stock');
    it.todo('adds new items from guest cart');
    it.todo('deletes guest cart document after merge');
    it.todo('caps merged quantity at available stock');
  });
});
