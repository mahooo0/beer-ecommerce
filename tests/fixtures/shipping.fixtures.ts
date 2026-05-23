// Zone fixtures
export const mockDomesticZone = {
  id: 'zone-us-1',
  name: 'Continental US',
  countries: ['US'],
  states: [],
  isActive: true,
  freeShippingThreshold: 5000, // $50.00 in cents
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  methods: [], // populated per test
};

export const mockAlaskaHawaiiZone = {
  id: 'zone-us-2',
  name: 'Alaska & Hawaii',
  countries: ['US'],
  states: ['AK', 'HI'],
  isActive: true,
  freeShippingThreshold: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  methods: [],
};

export const mockInternationalZone = {
  id: 'zone-intl-1',
  name: 'Europe',
  countries: ['GB', 'DE', 'FR'],
  states: [],
  isActive: true,
  freeShippingThreshold: 10000, // $100.00 in cents
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  methods: [],
};

// Method fixtures
export const mockFlatRateMethod = {
  id: 'method-flat-1',
  name: 'Standard Shipping',
  description: 'Arrives in 5-7 business days',
  zoneId: 'zone-us-1',
  rateType: 'FLAT_RATE' as const,
  flatRate: 599, // $5.99
  weightRate: null,
  minWeight: null,
  maxWeight: null,
  priceThresholds: null,
  estimatedDaysMin: 5,
  estimatedDaysMax: 7,
  isActive: true,
  position: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockWeightBasedMethod = {
  id: 'method-weight-1',
  name: 'Weight-Based Shipping',
  description: null,
  zoneId: 'zone-us-1',
  rateType: 'WEIGHT_BASED' as const,
  flatRate: null,
  weightRate: 150, // $1.50 per kg
  minWeight: 0.5,
  maxWeight: 30,
  priceThresholds: null,
  estimatedDaysMin: 3,
  estimatedDaysMax: 5,
  isActive: true,
  position: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockPriceBasedMethod = {
  id: 'method-price-1',
  name: 'Price-Based Shipping',
  description: null,
  zoneId: 'zone-us-1',
  rateType: 'PRICE_BASED' as const,
  flatRate: null,
  weightRate: null,
  minWeight: null,
  maxWeight: null,
  priceThresholds: { '0': 999, '2500': 499, '5000': 0 }, // under $25: $9.99, $25-$50: $4.99, $50+: free
  estimatedDaysMin: 5,
  estimatedDaysMax: 10,
  isActive: true,
  position: 2,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// Address fixtures for zone matching
export const mockUSAddress = { country: 'US', state: 'CA' };
export const mockAlaskaAddress = { country: 'US', state: 'AK' };
export const mockUKAddress = { country: 'GB', state: '' };
export const mockUnservicedAddress = { country: 'JP', state: '' };

// Cart fixtures for rate calculation
export const mockLightCart = { cartSubtotal: 2000, cartWeight: 1.5 }; // $20.00, 1.5kg
export const mockHeavyCart = { cartSubtotal: 8000, cartWeight: 25 }; // $80.00, 25kg
export const mockFreeShippingCart = { cartSubtotal: 6000, cartWeight: 2 }; // $60.00, 2kg (above $50 threshold)
export const mockOverweightCart = { cartSubtotal: 3000, cartWeight: 35 }; // exceeds 30kg max
