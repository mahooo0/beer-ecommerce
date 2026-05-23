import type { DriveStep } from 'driver.js';

export const homepageTourSteps: DriveStep[] = [
  {
    element: '#search-bar',
    popover: {
      title: 'Search Products',
      description:
        'Search for any product by name, brand, or category. We\'ll show instant results as you type.',
      side: 'bottom',
    },
  },
  {
    element: '#mega-menu',
    popover: {
      title: 'Browse Categories',
      description:
        'Explore our full product catalog organized by category.',
      side: 'bottom',
    },
  },
  {
    element: '#cart-icon',
    popover: {
      title: 'Your Cart',
      description:
        'Items you add will appear here. Click to review your cart anytime.',
      side: 'left',
    },
  },
];
