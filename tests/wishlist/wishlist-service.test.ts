import { describe, it } from 'vitest';

// ============================================================================
// WISHLIST SERVICE TEST STUBS
// ============================================================================
// These stubs document expected behaviors for WishlistService.
// Implementation will be added in Phase 08 Plan 01.

describe('WishlistService', () => {
  describe('getWishlist', () => {
    it.todo('returns user wishlist with items and products');
    it.todo('creates default wishlist if user has none');
    it.todo('throws 404 when wishlist not found for non-owner');
    it.todo('includes items sorted by addedAt descending');
  });

  describe('addItem', () => {
    it.todo('adds product to wishlist with priceAtAdd captured at add time');
    it.todo('returns existing item if product already in wishlist (idempotent)');
    it.todo('throws 404 when product does not exist');
    it.todo('throws 403 when user does not own the wishlist');
    it.todo('sets priceAtAdd from current product price in cents');
  });

  describe('removeItem', () => {
    it.todo('removes item from wishlist by product id');
    it.todo('throws 404 when item not found in wishlist');
    it.todo('throws 403 when user does not own the wishlist');
    it.todo('succeeds when item is the last item in wishlist');
  });

  describe('syncItems', () => {
    it.todo('merges guest wishlist items into user wishlist on login');
    it.todo('deduplicates items when same product exists in both wishlists');
    it.todo('preserves user wishlist priceAtAdd on dedup (not guest price)');
    it.todo('adds guest-only items to user wishlist with current price');
    it.todo('returns merged wishlist with all unique products');
  });

  describe('updateNotifyPrefs', () => {
    it.todo('updates notifyOnPriceDrop preference for wishlist item');
    it.todo('updates notifyOnRestock preference for wishlist item');
    it.todo('updates both preferences in single call');
    it.todo('throws 404 when wishlist item not found');
    it.todo('throws 403 when user does not own the wishlist');
  });
});
