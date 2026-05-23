import type { DriveStep } from 'driver.js';

export const productTourSteps: DriveStep[] = [
  {
    element: '#product-gallery',
    popover: {
      title: 'Product Images',
      description:
        'Browse product photos. Click any thumbnail to see it full size.',
      side: 'right',
    },
  },
  {
    element: '#variant-selector',
    popover: {
      title: 'Choose Options',
      description:
        'Select your preferred size, color, or other options.',
      side: 'left',
    },
  },
  {
    element: '#add-to-cart-btn',
    popover: {
      title: 'Add to Cart',
      description:
        'When you\'re ready, add this product to your cart.',
      side: 'top',
    },
  },
];
