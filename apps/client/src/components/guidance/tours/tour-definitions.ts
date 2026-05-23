export interface TourStepDef {
  element?: string;
  title: string;
  description: string;
  tip?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TourPage {
  id: string;
  title: string;
  path: string;
  steps: TourStepDef[];
}

export const TOUR_PAGES: TourPage[] = [
  // ─── PAGE 1: Homepage ────────────────────────────
  {
    id: 'homepage',
    title: 'Home',
    path: '/',
    steps: [
      {
        title: 'Welcome to the Store!',
        description:
          'This is a modern e-commerce template with all the features you need. Let us walk you through the key features of this platform.',
        tip: 'You can restart this tour anytime from the floating guide button.',
      },
      {
        element: '[data-tour="promo-banner"]',
        title: 'Promotional Banner',
        description:
          'Promotional banners appear at the top of the page to highlight current offers, discounts, and shipping deals.',
        position: 'bottom',
      },
      {
        element: '[data-tour="search"]',
        title: 'Smart Search',
        description:
          'Click the search icon to find any product instantly. The dropdown shows real-time results as you type, powered by Meilisearch.',
        tip: 'Try searching by product name, brand, or category.',
        position: 'bottom',
      },
      {
        element: '[data-tour="header-actions"]',
        title: 'Quick Actions',
        description:
          'Access your Compare list, Wishlist, and Shopping Cart from any page. Badges show the number of items in each.',
        position: 'bottom',
      },
      {
        element: '[data-tour="mega-menu"]',
        title: 'Category Navigation',
        description:
          'Browse products by category. Hover over any category to see subcategories in a dropdown menu with up to 3 levels of hierarchy.',
        position: 'bottom',
      },
      {
        element: '[data-tour="hero"]',
        title: 'Hero Section',
        description:
          'The hero showcases featured collections with a category dropdown for quick navigation. Gradient backgrounds create a premium feel.',
        position: 'bottom',
      },
      {
        element: '[data-tour="categories-grid"]',
        title: 'Shop by Category',
        description:
          'Categories are displayed in a clean grid. Click any category to browse its products. The grid-gap design creates a modern Zara-like aesthetic.',
        position: 'top',
      },
      {
        element: '[data-tour="new-arrivals"]',
        title: 'New Arrivals',
        description:
          'The latest products are displayed here. Each card shows the product image, brand, name, rating, price, and quick-action buttons on hover.',
        position: 'top',
      },
    ],
  },

  // ─── PAGE 2: Products Listing ───────────────────
  {
    id: 'products',
    title: 'Products',
    path: '/products',
    steps: [
      {
        element: '[data-tour="products-header"]',
        title: 'Products Page',
        description:
          'This is the main product catalog. You can see the total number of products and sort them by different criteria.',
        position: 'bottom',
      },
      {
        element: '[data-tour="sort-selector"]',
        title: 'Sort Products',
        description:
          'Sort products by newest, price (low to high or high to low), or alphabetically. The sort updates the URL for shareable links.',
        position: 'bottom',
      },
      {
        element: '[data-tour="view-toggle"]',
        title: 'Grid / List View',
        description:
          'Switch between grid and list view. Grid shows product cards in a 4-column layout, list shows detailed rows.',
        position: 'bottom',
      },
      {
        element: '[data-tour="product-card"]',
        title: 'Product Card',
        description:
          'Each product card shows: image (with hover to see alternate), brand, name, rating, and price. Hover to reveal action buttons.',
        tip: 'Products added in the last 14 days get a "New" badge automatically.',
        position: 'right',
      },
      {
        element: '[data-tour="card-wishlist"]',
        title: 'Add to Wishlist',
        description:
          'Click the heart icon to add a product to your wishlist. It syncs with your account when signed in.',
        position: 'left',
      },
      {
        element: '[data-tour="card-compare"]',
        title: 'Add to Compare',
        description:
          'Click the compare icon to add products to your comparison list. Compare up to 4 products side by side.',
        position: 'left',
      },
      {
        element: '[data-tour="card-actions"]',
        title: 'Quick Buy Actions',
        description:
          '"Add to Cart" adds the item to your cart. "Buy Now" adds it and redirects you straight to checkout — one-click purchase.',
        position: 'top',
      },
    ],
  },

  // ─── PAGE 3: Product Detail ──────────────────────
  {
    id: 'product-detail',
    title: 'Product Detail',
    path: '/products/__first__',
    steps: [
      {
        element: '[data-tour="product-gallery"]',
        title: 'Product Gallery',
        description:
          'Browse high-resolution product photos. Click thumbnails to switch images, or click the main image for a full-screen lightbox view.',
        position: 'right',
      },
      {
        element: '[data-tour="product-info"]',
        title: 'Product Information',
        description:
          'See the product name, brand, rating, and detailed pricing. Sale items show the original price with a discount badge.',
        position: 'left',
      },
      {
        element: '[data-tour="add-to-cart"]',
        title: 'Add to Cart',
        description:
          'Select your quantity and add the product to your cart. The quantity selector supports keyboard input and +/- buttons.',
        position: 'top',
      },
      {
        element: '[data-tour="buy-now"]',
        title: 'Buy in One Click',
        description:
          'Skip the browsing — "Buy in One Click" adds the item to your cart and takes you straight to checkout.',
        tip: 'This is perfect for returning customers who know exactly what they want.',
        position: 'top',
      },
      {
        element: '[data-tour="wishlist-compare"]',
        title: 'Wishlist & Compare',
        description:
          'Save products to your wishlist for later, or add them to your comparison list to evaluate features side by side.',
        position: 'top',
      },
    ],
  },

  // ─── PAGE 4: Cart ────────────────────────────────
  {
    id: 'cart',
    title: 'Cart',
    path: '/cart',
    steps: [
      {
        element: '[data-tour="cart-items"]',
        title: 'Cart Items',
        description:
          'Review all items in your cart. Each item shows the product image, name, variant details, quantity controls, and line total.',
        position: 'right',
      },
      {
        element: '[data-tour="order-summary"]',
        title: 'Order Summary',
        description:
          'See your subtotal, applied discounts, and estimated total. Apply coupon codes for additional savings.',
        position: 'left',
      },
      {
        element: '[data-tour="checkout-btn"]',
        title: 'Proceed to Checkout',
        description:
          'When you\'re ready, proceed to checkout to enter your shipping address and payment details. The process is secure and fast.',
        position: 'top',
      },
      {
        title: 'Tour Complete!',
        description:
          'You\'ve seen the key features of this e-commerce platform. Explore on your own — add products to your wishlist, compare items, or start shopping!',
        tip: 'You can restart this tour anytime from the guide button in the bottom corner.',
      },
    ],
  },
];

/**
 * Find which tour page matches the current pathname.
 * Handles dynamic product detail routes.
 */
export function getTourPageForPath(pathname: string): TourPage | null {
  // Exact match
  const exact = TOUR_PAGES.find((p) => p.path === pathname);
  if (exact) return exact;

  // Product detail page match
  if (pathname.startsWith('/products/') && pathname !== '/products') {
    return TOUR_PAGES.find((p) => p.id === 'product-detail') ?? null;
  }

  return null;
}
