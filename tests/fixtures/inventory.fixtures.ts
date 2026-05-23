// Warehouse fixtures
export const mockWarehouse = {
  id: 'wh-1',
  name: 'Main Warehouse',
  code: 'MAIN',
  address: '123 Warehouse Blvd',
  city: 'New York',
  state: 'NY',
  country: 'US',
  zipCode: '10001',
  latitude: 40.7128,
  longitude: -74.006,
  priority: 10,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockWarehouse2 = {
  id: 'wh-2',
  name: 'West Coast',
  code: 'WEST',
  address: '456 Logistics Ave',
  city: 'Los Angeles',
  state: 'CA',
  country: 'US',
  zipCode: '90001',
  latitude: 34.0522,
  longitude: -118.2437,
  priority: 5,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

// Inventory item fixtures
export const mockInventoryItem = {
  id: 'inv-1',
  variantId: 'var-1',
  warehouseId: 'wh-1',
  quantity: 100,
  reserved: 5,
  lowStockThreshold: 10,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockInventoryItemLowStock = {
  id: 'inv-2',
  variantId: 'var-2',
  warehouseId: 'wh-1',
  quantity: 8,
  reserved: 5,
  lowStockThreshold: 10,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

// Stock movement fixtures
export const mockStockMovement = {
  id: 'mov-1',
  inventoryItemId: 'inv-1',
  quantity: -1,
  reason: 'SALE',
  reference: 'order-123',
  note: null,
  createdAt: new Date('2024-06-01T00:00:00Z'),
};

export const mockReservationMovement = {
  id: 'mov-2',
  inventoryItemId: 'inv-1',
  quantity: -2,
  reason: 'RESERVATION',
  reference: 'checkout-456',
  note: null,
  createdAt: new Date('2024-06-01T00:00:00Z'),
};
