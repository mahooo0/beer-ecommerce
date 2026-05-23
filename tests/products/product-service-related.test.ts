import { describe, it } from 'vitest';

describe('ProductService.getRelated', () => {
  it.todo('returns same-category products for a given product ID');
  it.todo('excludes the current product from related results');
  it.todo('returns products matching overlapping tags when no same-category products exist');
  it.todo('respects the limit parameter and returns at most N products');
  it.todo('returns empty array when product is not found');
  it.todo('only returns ACTIVE products with isActive=true');
});
