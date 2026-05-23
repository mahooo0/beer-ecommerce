// Search document fixtures for testing Meilisearch integration

export interface SearchDocument {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  images: string[];
  status: string;
  productType: string;
  brandId: string | null;
  brandName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryPath: string | null;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

export const mockSearchDocument: SearchDocument = {
  id: 'prod-1',
  name: 'Wireless Bluetooth Headphones',
  description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
  sku: 'AUDIO-WBH-001',
  price: 7999,
  images: ['https://cdn.example.com/headphones-1.jpg'],
  status: 'ACTIVE',
  productType: 'SIMPLE',
  brandId: 'brand-1',
  brandName: 'AudioTech',
  categoryId: 'cat-electronics',
  categoryName: 'Audio Equipment',
  categoryPath: '/electronics/audio',
  createdAt: 1704067200, // 2024-01-01T00:00:00Z
  updatedAt: 1704067200,
};

export const mockSearchDocuments: SearchDocument[] = [
  {
    id: 'prod-1',
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
    sku: 'AUDIO-WBH-001',
    price: 7999,
    images: ['https://cdn.example.com/headphones-1.jpg'],
    status: 'ACTIVE',
    productType: 'SIMPLE',
    brandId: 'brand-1',
    brandName: 'AudioTech',
    categoryId: 'cat-electronics',
    categoryName: 'Audio Equipment',
    categoryPath: '/electronics/audio',
    createdAt: 1704067200,
    updatedAt: 1704067200,
  },
  {
    id: 'prod-2',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable organic cotton t-shirt available in multiple sizes and colors',
    sku: 'APPAREL-OCT-001',
    price: 2499,
    images: ['https://cdn.example.com/tshirt-1.jpg'],
    status: 'ACTIVE',
    productType: 'VARIABLE',
    brandId: 'brand-2',
    brandName: 'EcoWear',
    categoryId: 'cat-clothing',
    categoryName: 'T-Shirts',
    categoryPath: '/clothing/tops/t-shirts',
    createdAt: 1704153600,
    updatedAt: 1704153600,
  },
  {
    id: 'prod-3',
    name: 'Fresh Organic Bananas',
    description: 'Premium organic bananas sold by weight',
    sku: 'PRODUCE-FOB-001',
    price: 299,
    images: ['https://cdn.example.com/bananas-1.jpg'],
    status: 'ACTIVE',
    productType: 'WEIGHTED',
    brandId: null,
    brandName: null,
    categoryId: 'cat-produce',
    categoryName: 'Fruits',
    categoryPath: '/grocery/produce/fruits',
    createdAt: 1704240000,
    updatedAt: 1704240000,
  },
  {
    id: 'prod-4',
    name: 'Complete TypeScript Course',
    description: 'Comprehensive video course covering TypeScript from basics to advanced',
    sku: 'DIGITAL-CTC-001',
    price: 4999,
    images: ['https://cdn.example.com/course-1.jpg'],
    status: 'ACTIVE',
    productType: 'DIGITAL',
    brandId: 'brand-3',
    brandName: 'CodeAcademy Pro',
    categoryId: 'cat-courses',
    categoryName: 'Programming Courses',
    categoryPath: '/education/courses/programming',
    createdAt: 1704326400,
    updatedAt: 1704326400,
  },
  {
    id: 'prod-5',
    name: 'Home Office Starter Bundle',
    description: 'Complete home office setup including desk, chair, and accessories',
    sku: 'BUNDLE-HOSB-001',
    price: 49999,
    images: ['https://cdn.example.com/bundle-1.jpg'],
    status: 'ACTIVE',
    productType: 'BUNDLE',
    brandId: 'brand-4',
    brandName: 'OfficeMax',
    categoryId: 'cat-furniture',
    categoryName: 'Office Bundles',
    categoryPath: '/furniture/office/bundles',
    createdAt: 1704412800,
    updatedAt: 1704412800,
  },
];

export const mockFacetDistribution = {
  brandName: {
    'AudioTech': 15,
    'EcoWear': 42,
    'CodeAcademy Pro': 8,
    'OfficeMax': 23,
  },
  categoryName: {
    'Audio Equipment': 15,
    'T-Shirts': 38,
    'Fruits': 64,
    'Programming Courses': 12,
    'Office Bundles': 9,
  },
  price: {
    '0-1000': 45,
    '1000-5000': 72,
    '5000-10000': 18,
    '10000+': 3,
  },
};

export const mockSearchResults = {
  hits: mockSearchDocuments,
  estimatedTotalHits: 5,
  facetDistribution: mockFacetDistribution,
  processingTimeMs: 12,
  query: 'organic',
  limit: 20,
  offset: 0,
};
