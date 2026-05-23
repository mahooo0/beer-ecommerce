import type { DriveStep } from 'driver.js';

export const productCreateTourSteps: DriveStep[] = [
  {
    element: '#product-type-select',
    popover: {
      title: 'Product Type',
      description:
        'Choose the product type. Each type has specific fields (variable has variants, digital has files, etc.).',
      side: 'bottom',
    },
  },
  {
    element: '#product-basic-info',
    popover: {
      title: 'Basic Information',
      description:
        'Enter the product name, description, and pricing. SKU is auto-generated.',
      side: 'right',
    },
  },
  {
    element: '#product-images',
    popover: {
      title: 'Product Images',
      description:
        'Upload images via drag-and-drop. Reorder by dragging. First image becomes the main photo.',
      side: 'left',
    },
  },
  {
    element: '#product-status',
    popover: {
      title: 'Status',
      description:
        'Set to Draft while editing, then Active when ready to display in the store.',
      side: 'left',
    },
  },
];
