import type { DriveStep } from 'driver.js';

export const dashboardTourSteps: DriveStep[] = [
  {
    element: '#sidebar-products',
    popover: {
      title: 'Products',
      description:
        'Create and manage your entire product catalog including all product types.',
      side: 'right',
    },
  },
  {
    element: '#sidebar-orders',
    popover: {
      title: 'Orders',
      description:
        'View and manage customer orders, update status, and add tracking.',
      side: 'right',
    },
  },
  {
    element: '#sidebar-categories',
    popover: {
      title: 'Categories',
      description:
        'Organize products with categories, brands, tags, and collections.',
      side: 'right',
    },
  },
  {
    element: '#sidebar-shipping',
    popover: {
      title: 'Shipping',
      description:
        'Set up shipping zones, methods, and rates for your store.',
      side: 'right',
    },
  },
  {
    element: '#sidebar-inventory',
    popover: {
      title: 'Inventory',
      description:
        'Track stock levels across warehouses and manage inventory.',
      side: 'right',
    },
  },
];
