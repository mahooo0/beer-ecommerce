import { describe, it } from 'vitest';

describe('ProductService.getFrequentlyBoughtTogether', () => {
  it.todo('returns empty array gracefully when no order history exists');
  it.todo('returns co-purchased products that appear in at least 2 orders together');
  it.todo('excludes the current product from FBT results');
  it.todo('returns products sorted by co-purchase frequency (most frequent first)');
  it.todo('respects the limit parameter');
  it.todo('only returns ACTIVE products with isActive=true');
  it.todo('returns empty array on MongoDB aggregation error (graceful degradation)');
});
