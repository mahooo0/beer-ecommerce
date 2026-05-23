import { describe, it } from 'vitest';

// ============================================================================
// PRICE DROP BADGE TEST STUBS
// ============================================================================
// These stubs document expected behaviors for the PriceDropBadge component.
// Implementation will be added in Phase 08 Plan 03.

describe('PriceDropBadge', () => {
  describe('rendering', () => {
    it.todo('renders "Price dropped!" badge when currentPrice < priceAtAdd');
    it.todo('renders savings amount as formatted currency');
    it.todo('renders savings percentage alongside savings amount');
    it.todo('does not render when currentPrice equals priceAtAdd');
    it.todo('does not render when currentPrice is greater than priceAtAdd');
    it.todo('does not render when priceAtAdd is 0 (no price snapshot available)');
  });

  describe('formatting', () => {
    it.todo('formats prices in correct locale currency format');
    it.todo('shows correct absolute savings (priceAtAdd - currentPrice in cents)');
    it.todo('shows correct percentage savings rounded to nearest integer');
  });

  describe('accessibility', () => {
    it.todo('includes aria-label describing the price drop for screen readers');
  });
});
