import { mockSimpleProduct } from '../setup.js';

// ============================================================================
// WISHLIST FIXTURES
// ============================================================================

export const mockWishlist = {
  id: 'wl-1',
  name: 'My Wishlist',
  userId: 'user-1',
  isPublic: false,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockWishlistItem = {
  id: 'wli-1',
  wishlistId: 'wl-1',
  productId: 'prod-1',
  addedAt: new Date('2024-01-01T00:00:00Z'),
  priceAtAdd: 1999,
  notifyOnPriceDrop: true,
  notifyOnRestock: true,
};

export const mockWishlistItemWithProduct = {
  ...mockWishlistItem,
  product: {
    ...mockSimpleProduct,
  },
};

// ============================================================================
// COMPARE FIXTURES
// ============================================================================

export const mockCompareProducts = [
  {
    id: 'prod-1',
    name: 'Laptop Pro 15',
    slug: 'laptop-pro-15',
    description: 'High-performance laptop with 15-inch display',
    price: 149999,
    sku: 'LAPTOP-PRO-15',
    productType: 'SIMPLE',
    status: 'ACTIVE',
    images: ['https://example.com/laptop-pro-15.jpg'],
    isActive: true,
    categoryId: 'cat-electronics',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    attributes: {
      processor: 'Intel Core i9',
      ram: '32GB',
      storage: '1TB SSD',
      display: '15.6 inch',
    },
  },
  {
    id: 'prod-2',
    name: 'Laptop Air 13',
    slug: 'laptop-air-13',
    description: 'Ultra-thin laptop with 13-inch display',
    price: 99999,
    sku: 'LAPTOP-AIR-13',
    productType: 'SIMPLE',
    status: 'ACTIVE',
    images: ['https://example.com/laptop-air-13.jpg'],
    isActive: true,
    categoryId: 'cat-electronics',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    attributes: {
      processor: 'Apple M2',
      ram: '16GB',
      storage: '512GB SSD',
      display: '13.3 inch',
    },
  },
  {
    id: 'prod-3',
    name: 'Laptop Budget 14',
    slug: 'laptop-budget-14',
    description: 'Affordable laptop with 14-inch display',
    price: 49999,
    sku: 'LAPTOP-BUDGET-14',
    productType: 'SIMPLE',
    status: 'ACTIVE',
    images: ['https://example.com/laptop-budget-14.jpg'],
    isActive: true,
    categoryId: 'cat-electronics',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    attributes: {
      processor: 'AMD Ryzen 5',
      ram: '8GB',
      storage: '256GB SSD',
      display: '14 inch',
    },
  },
];
