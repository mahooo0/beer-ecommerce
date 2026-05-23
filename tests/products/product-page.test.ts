import { describe, it } from 'vitest';

// PDPG-01: Product image gallery
describe('Product Image Gallery (PDPG-01)', () => {
  it.todo('renders main image with first product image by default');
  it.todo('clicking a thumbnail updates the main displayed image');
  it.todo('renders all product images as thumbnails');
});

// PDPG-03: Specifications / attributes table
describe('Product Specifications Table (PDPG-03)', () => {
  it.todo('renders a specs table with product attributes');
  it.todo('renders attribute keys and values correctly');
});

// PDPG-06: Reviews section with rating distribution
describe('Product Reviews Section (PDPG-06)', () => {
  it.todo('renders reviews section with average rating');
  it.todo('shows rating distribution breakdown (5-star, 4-star, etc.)');
  it.todo('displays individual review cards with author and date');
});

// PDPG-07: Stock status labels
describe('Stock Status Labels (PDPG-07)', () => {
  it.todo('shows "In Stock" label when product has available inventory');
  it.todo('shows "Out of Stock" label when inventory is zero and preorder disabled');
  it.todo('shows "Pre-order" label when inventory is zero and preorder enabled');
});

// PDPG-08: Weighted product price slider
describe('Weighted Product Price Slider (PDPG-08)', () => {
  it.todo('renders weight slider for weighted product type');
  it.todo('updates displayed price when weight slider value changes');
  it.todo('respects minWeight and maxWeight constraints from weightedMeta');
  it.todo('uses stepWeight increments from weightedMeta');
});

// PDPG-09: Digital product info display
describe('Digital Product Info (PDPG-09)', () => {
  it.todo('shows file icon indicating digital product');
  it.todo('displays file name and formatted file size');
  it.todo('shows max downloads limit when specified');
  it.todo('shows access duration when specified');
});

// PDPG-10: Bundle product savings calculation
describe('Bundle Product Savings (PDPG-10)', () => {
  it.todo('displays individual bundle items with quantities');
  it.todo('calculates total savings from bundle item discounts');
  it.todo('shows bundle savings percentage vs buying items separately');
});
