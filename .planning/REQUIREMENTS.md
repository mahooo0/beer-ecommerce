# Requirements: Universal E-Commerce Template

**Defined:** 2026-03-10
**Core Value:** A single template that handles every possible e-commerce scenario (simple products, variable products with option combinations, weighted products, digital goods, bundled products) without needing architectural changes.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases. 21 features, each = one phase.

### Database Schema

- [x] **SCHEMA-01**: Prisma schema includes complete User model with roles (CUSTOMER, ADMIN, SUPER_ADMIN), profile fields, and address relations
- [x] **SCHEMA-02**: Prisma schema includes Product model supporting all types (simple, variable, weighted, digital, bundled) via discriminator field
- [x] **SCHEMA-03**: Prisma schema includes Category model with materialized path for infinite depth tree
- [x] **SCHEMA-04**: Prisma schema includes ProductVariant model with option combinations (size/color/material) and independent pricing/stock
- [x] **SCHEMA-05**: Prisma schema includes dynamic attributes as JSONB columns with GIN indexes for filterable properties per category
- [x] **SCHEMA-06**: Prisma schema includes CategoryAttribute model defining which filterable attributes belong to each category
- [x] **SCHEMA-07**: Prisma schema includes Brand, Tag, Collection models for product organization
- [x] **SCHEMA-08**: Prisma schema includes Address, Wishlist, Review, Coupon, Promotion models
- [x] **SCHEMA-09**: Prisma schema includes Shipping (zones, methods, rates), Warehouse, InventoryItem models
- [x] **SCHEMA-10**: Mongoose schema includes Order document with full lifecycle, line items, payment info, shipping info, status history
- [x] **SCHEMA-11**: Mongoose schema includes Cart document supporting guest and authenticated users with TTL
- [x] **SCHEMA-12**: All schemas have proper indexes, relations, cascading deletes, and validation constraints
- [x] **SCHEMA-13**: Database seeds exist with realistic sample data for all entity types

### Authentication

- [x] **AUTH-01**: Clerk SDK integrated in server with webhook handling for user sync
- [x] **AUTH-02**: User can register with email/password via Clerk on client app
- [x] **AUTH-03**: User can login with OAuth providers (Google, GitHub) via Clerk on client app
- [x] **AUTH-04**: User session persists across browser refresh on both client and admin apps
- [x] **AUTH-05**: Admin app restricts access to ADMIN and SUPER_ADMIN roles only
- [x] **AUTH-06**: Server middleware validates Clerk JWT tokens and attaches user to request
- [x] **AUTH-07**: User can view and edit profile (name, email, avatar) on client app
- [x] **AUTH-08**: User can manage saved addresses (add, edit, delete, set default)
- [x] **AUTH-09**: Admin can manage users (view list, view details, change roles, disable accounts)

### Product Catalog

- [x] **PROD-01**: Admin can create simple products with name, description, price, images, SKU
- [x] **PROD-02**: Admin can create variable products with option groups (size, color, material) and variant combinations
- [x] **PROD-03**: Admin can create weighted products with unit pricing (per kg/lb/piece)
- [x] **PROD-04**: Admin can create digital products with downloadable file attachments and access rules
- [x] **PROD-05**: Admin can create bundled products composed of multiple other products with bundle pricing
- [x] **PROD-06**: Admin can upload and manage product images via Cloudinary (drag-drop, reorder, crop)
- [x] **PROD-07**: Admin can set product status (draft, active, archived) and visibility
- [x] **PROD-08**: Client app displays product listings with pagination, sorting (price, name, date, popularity)
- [x] **PROD-09**: Client app displays product cards with image, name, price, rating, quick-add-to-cart
- [x] **PROD-10**: API supports bulk product operations (import CSV, bulk status change, bulk delete)

### Categories & Navigation

- [x] **CAT-01**: Admin can create categories with infinite depth tree structure using drag-and-drop
- [x] **CAT-02**: Admin can assign dynamic attributes/characteristics to categories (e.g., screen size for Electronics > TVs)
- [x] **CAT-03**: Admin can manage collections (curated product groups), brands, and tags
- [x] **CAT-04**: Client app renders mega menu from category tree (top 2-3 levels)
- [x] **CAT-05**: Client app renders breadcrumbs showing full category path
- [x] **CAT-06**: Client app displays category page with products, subcategories, and applied filters
- [x] **CAT-07**: Categories support SEO fields (slug, meta title, meta description, custom URL)

### Search System

- [x] **SRCH-01**: Meilisearch instance configured and synced with product catalog
- [x] **SRCH-02**: Client app provides search-as-you-type with autocomplete suggestions (<100ms response)
- [x] **SRCH-03**: Search supports full-text across product name, description, SKU, brand, category
- [x] **SRCH-04**: Search has typo tolerance and synonym mapping
- [x] **SRCH-05**: Search results include facet counts for dynamic filtering
- [x] **SRCH-06**: Admin can configure search settings (synonyms, stop words, ranking rules)

### Filter System

- [x] **FILT-01**: Category pages show dynamic attribute-based filters derived from category's assigned attributes
- [x] **FILT-02**: Price range filter with slider and min/max input fields
- [x] **FILT-03**: Multi-select filters with checkbox groups (brand, color, size, etc.) showing product counts
- [x] **FILT-04**: Filter state persists in URL parameters for shareable/bookmarkable filtered views
- [x] **FILT-05**: Filters use OR logic within groups and AND logic across groups
- [x] **FILT-06**: Mobile filter UI uses full-screen modal with apply/clear buttons
- [x] **FILT-07**: Availability filter (in stock, out of stock, pre-order)

### Product Page

- [x] **PDPG-01**: Product page displays image gallery with zoom, thumbnails, and fullscreen lightbox
- [x] **PDPG-02**: Variable products show variant selector (dropdowns/swatches) that updates price, images, and stock
- [x] **PDPG-03**: Product page shows specifications/attributes table
- [x] **PDPG-04**: Product page shows related products carousel
- [x] **PDPG-05**: Product page shows "frequently bought together" section with one-click add-all
- [x] **PDPG-06**: Product page shows reviews section with average rating, distribution, and individual reviews
- [x] **PDPG-07**: Product page shows real-time stock status (in stock, low stock with count, out of stock)
- [x] **PDPG-08**: Weighted products show unit price calculator (price per kg/lb with quantity selector)
- [x] **PDPG-09**: Digital products show file info, preview, and delivery method description
- [x] **PDPG-10**: Bundle products show included items with individual and bundle pricing comparison

### Wishlist & Compare

- [x] **WISH-01**: User can add/remove products to wishlist from product card or product page
- [x] **WISH-02**: Wishlist persists in localStorage for guests and syncs to database on login
- [x] **WISH-03**: User can view wishlist page with product cards and quick-add-to-cart
- [x] **WISH-04**: User can select 2-4 products for side-by-side comparison
- [x] **WISH-05**: Compare page shows specification table with differences highlighted
- [x] **WISH-06**: User receives price drop and back-in-stock notifications for wishlisted items

### Cart System

- [x] **CART-01**: User can add products to cart with selected variant, quantity
- [x] **CART-02**: Cart supports guest users (localStorage/cookie) and authenticated users (database)
- [x] **CART-03**: Guest cart merges with authenticated cart on login
- [x] **CART-04**: Cart persists across browser sessions
- [x] **CART-05**: User can update quantity, remove items, and clear cart
- [x] **CART-06**: Cart shows real-time price calculation (subtotal, tax estimate, shipping estimate)
- [x] **CART-07**: User can apply coupon/promo codes to cart with validation feedback
- [x] **CART-08**: Cart validates stock availability before checkout and shows warnings for low/out-of-stock items
- [x] **CART-09**: Mini cart (slide-out/dropdown) accessible from header on all pages

### Checkout

- [ ] **CHKT-01**: Multi-step checkout flow: Information > Shipping > Payment > Review > Confirmation
- [ ] **CHKT-02**: User can select from saved addresses or enter new shipping/billing address
- [ ] **CHKT-03**: Shipping method selection with calculated rates per method
- [ ] **CHKT-04**: Order summary visible throughout checkout with item details and running total
- [ ] **CHKT-05**: Guest checkout supported with email collection
- [ ] **CHKT-06**: Checkout validates stock and reserves inventory during payment processing
- [ ] **CHKT-07**: Order confirmation page with order number, summary, and estimated delivery
- [ ] **CHKT-08**: Checkout is mobile-optimized with express checkout options (Apple Pay, Google Pay)

### Payments

- [ ] **PAY-01**: Stripe integration with payment intent flow for card payments
- [ ] **PAY-02**: Apple Pay and Google Pay support via Stripe Payment Request Button
- [ ] **PAY-03**: Stripe webhook handler processes payment events (succeeded, failed, refunded)
- [ ] **PAY-04**: Webhook signature verification with raw body parsing
- [ ] **PAY-05**: Payment status reflected in order lifecycle
- [ ] **PAY-06**: Admin can issue full or partial refunds from order detail page
- [ ] **PAY-07**: Server-side price recalculation before payment (never trust client prices)

### Order System

- [ ] **ORD-01**: Order created from successful checkout with unique order number
- [ ] **ORD-02**: Order lifecycle: pending > paid > processing > shipped > delivered (with cancel/return paths)
- [ ] **ORD-03**: User can view order history with status, items, and tracking on client app
- [ ] **ORD-04**: User can view detailed order page with timeline of status changes
- [ ] **ORD-05**: User can request return/refund with reason and optional photo upload
- [ ] **ORD-06**: Admin can view all orders with filtering (status, date, customer, amount)
- [ ] **ORD-07**: Admin can update order status, add tracking number, and add internal notes
- [ ] **ORD-08**: PDF invoice generation for each order
- [ ] **ORD-09**: Saga pattern ensures consistency between PostgreSQL (product/inventory) and MongoDB (order)

### Shipping

- [x] **SHIP-01**: Admin can define shipping zones (geographic regions)
- [x] **SHIP-02**: Admin can configure shipping methods per zone (flat rate, weight-based, free above threshold)
- [x] **SHIP-03**: Shipping rate calculated at checkout based on cart weight, destination zone, and selected method
- [x] **SHIP-04**: Admin can add tracking numbers to orders with carrier selection
- [x] **SHIP-05**: User can track shipment status from order detail page
- [x] **SHIP-06**: Free shipping threshold configurable per zone

### Inventory Management

- [x] **INV-01**: Stock tracked per SKU (variant-level) with real-time quantities
- [x] **INV-02**: Low stock alerts configurable per product with threshold
- [x] **INV-03**: Admin can manage multiple warehouses with location and priority
- [x] **INV-04**: Stock allocation per warehouse with intelligent routing to nearest warehouse
- [x] **INV-05**: Atomic stock reservation with TTL (15 min) during checkout, commit on payment, release on abandon
- [x] **INV-06**: Admin inventory dashboard showing stock levels, alerts, and movement history
- [x] **INV-07**: Stock adjustment history with reason tracking (sale, return, manual adjustment, damage)
- [x] **INV-08**: SKU auto-generation based on product attributes

### Promotions & Discounts

- [ ] **PRMO-01**: Admin can create coupon codes (percentage, fixed amount, free shipping)
- [ ] **PRMO-02**: Admin can set coupon conditions (min cart total, specific products/categories, customer segments)
- [ ] **PRMO-03**: Admin can set coupon limits (usage count, per-customer limit, expiration date)
- [ ] **PRMO-04**: BOGO (buy one get one) promotions with configurable buy/get quantities
- [ ] **PRMO-05**: Bulk/tiered pricing (buy 3+ get 10% off)
- [ ] **PRMO-06**: Flash sales with countdown timer and scheduled start/end
- [ ] **PRMO-07**: Stackable vs non-stackable promotion rules
- [ ] **PRMO-08**: Admin promotions dashboard showing active, scheduled, and expired promotions with performance metrics

### Reviews & Ratings

- [ ] **REV-01**: Authenticated user can submit star rating (1-5) and written review for purchased products
- [ ] **REV-02**: User can upload photos with review
- [ ] **REV-03**: Product page shows average rating, rating distribution, and paginated reviews
- [ ] **REV-04**: Reviews sortable by date, rating, helpfulness
- [ ] **REV-05**: Users can mark reviews as helpful
- [ ] **REV-06**: Admin moderation queue for new reviews (approve, reject, flag)
- [ ] **REV-07**: Verified purchase badge on reviews from confirmed buyers

### Notifications

- [ ] **NOTF-01**: Transactional emails via Resend with React Email templates
- [ ] **NOTF-02**: Order confirmation email with order details
- [ ] **NOTF-03**: Shipping confirmation email with tracking info
- [ ] **NOTF-04**: Order status update emails (processing, delivered)
- [ ] **NOTF-05**: Abandoned cart recovery email sequence (1hr, 24hr, 72hr)
- [ ] **NOTF-06**: Account welcome email on registration
- [ ] **NOTF-07**: Low stock alert emails to admin
- [ ] **NOTF-08**: Admin can preview and customize email templates

### Analytics

- [ ] **ANLT-01**: Admin dashboard shows revenue metrics (daily, weekly, monthly, YoY comparison)
- [ ] **ANLT-02**: Admin dashboard shows conversion funnel (visits > cart > checkout > purchase)
- [ ] **ANLT-03**: Admin dashboard shows best-selling products and categories
- [ ] **ANLT-04**: Admin dashboard shows customer insights (new vs returning, top customers, average order value)
- [ ] **ANLT-05**: Date range picker and export to CSV for all analytics views
- [ ] **ANLT-06**: Google Analytics 4 integration on client app
- [ ] **ANLT-07**: PostHog integration for product analytics and session recording

### SEO

- [ ] **SEO-01**: Dynamic meta tags (title, description, OG tags) on all client pages
- [ ] **SEO-02**: SEO-friendly URLs with slugs for products, categories, and collections
- [ ] **SEO-03**: Canonical URLs to prevent duplicate content from filters and pagination
- [ ] **SEO-04**: Automatic XML sitemap generation with product and category pages
- [ ] **SEO-05**: JSON-LD structured data (Product, ProductGroup, BreadcrumbList, Organization)
- [ ] **SEO-06**: Robots.txt configuration with noindex for filter parameter pages
- [ ] **SEO-07**: Admin can edit SEO fields (meta title, description, slug) per product and category

### Multi-Store

- [ ] **MSTR-01**: Multi-language support with i18n framework (content translations per locale)
- [ ] **MSTR-02**: Multi-currency support with real-time exchange rates and currency selector
- [ ] **MSTR-03**: Locale detection and automatic redirection based on browser/IP
- [ ] **MSTR-04**: Admin can manage translations for products, categories, and static content
- [ ] **MSTR-05**: Price formatting respects locale conventions (symbol placement, decimal separator)
- [ ] **MSTR-06**: Admin can configure available languages and currencies

### Admin Panel

- [ ] **ADMN-01**: Admin dashboard with KPI cards (revenue, orders, customers, conversion rate)
- [ ] **ADMN-02**: Admin sidebar navigation organized by module with collapsible sections
- [ ] **ADMN-03**: Role-based access control (SUPER_ADMIN sees everything, ADMIN has configurable permissions)
- [ ] **ADMN-04**: Admin data tables with sorting, filtering, pagination, and bulk actions for all entities
- [ ] **ADMN-05**: Admin forms with validation, image upload, rich text editor for all CRUD operations
- [ ] **ADMN-06**: Admin activity log showing who changed what and when
- [ ] **ADMN-07**: Admin settings page for store configuration (name, logo, contact, tax rates, policies)
- [ ] **ADMN-08**: Responsive admin layout that works on tablet and desktop

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Commerce

- **ADV-01**: Subscription products with recurring billing via Stripe
- **ADV-02**: Gift cards with variable amounts, email delivery, and balance tracking
- **ADV-03**: Customer loyalty/points program with tier levels
- **ADV-04**: Pre-order support with deposit payment and stock notification
- **ADV-05**: Back-in-stock notification opt-in from product page
- **ADV-06**: AI-powered product recommendations based on browsing/purchase history

### Advanced Marketing

- **MKT-01**: SMS notifications for order updates
- **MKT-02**: Push notifications via service worker
- **MKT-03**: Social sharing for wishlists and products
- **MKT-04**: BNPL integration (Klarna/Afterpay)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-vendor marketplace | Different architecture entirely, would dilute template focus |
| Built-in CMS/Blog | Solved by headless CMS integration, not core e-commerce |
| Real-time chat/support | High complexity, better as third-party integration (Intercom, Zendesk) |
| AR product preview | Experimental, device-dependent, low ROI for template |
| Native mobile app | Web-first template, mobile can be added via React Native later |
| Blockchain/crypto payments | Niche demand, regulatory uncertainty |
| Visual product customization | Print-on-demand tools are niche, better as integration |
| Built-in shipping label generation | Better handled by ShipStation, Shippo, or EasyPost |
| Full warehouse management (WMS) | Enterprise-level complexity, basic multi-warehouse sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHEMA-01 | Phase 1: Database Schema Design | Pending |
| SCHEMA-02 | Phase 1: Database Schema Design | Complete |
| SCHEMA-03 | Phase 1: Database Schema Design | Complete |
| SCHEMA-04 | Phase 1: Database Schema Design | Complete |
| SCHEMA-05 | Phase 1: Database Schema Design | Complete |
| SCHEMA-06 | Phase 1: Database Schema Design | Complete |
| SCHEMA-07 | Phase 1: Database Schema Design | Complete |
| SCHEMA-08 | Phase 1: Database Schema Design | Pending |
| SCHEMA-09 | Phase 1: Database Schema Design | Pending |
| SCHEMA-10 | Phase 1: Database Schema Design | Complete |
| SCHEMA-11 | Phase 1: Database Schema Design | Complete |
| SCHEMA-12 | Phase 1: Database Schema Design | Complete |
| SCHEMA-13 | Phase 1: Database Schema Design | Complete |
| AUTH-01 | Phase 2: Authentication System | Complete |
| AUTH-02 | Phase 2: Authentication System | Complete |
| AUTH-03 | Phase 2: Authentication System | Complete |
| AUTH-04 | Phase 2: Authentication System | Complete |
| AUTH-05 | Phase 2: Authentication System | Complete |
| AUTH-06 | Phase 2: Authentication System | Complete |
| AUTH-07 | Phase 2: Authentication System | Complete |
| AUTH-08 | Phase 2: Authentication System | Complete |
| AUTH-09 | Phase 2: Authentication System | Complete |
| PROD-01 | Phase 3: Product Catalog | Complete |
| PROD-02 | Phase 3: Product Catalog | Complete |
| PROD-03 | Phase 3: Product Catalog | Complete |
| PROD-04 | Phase 3: Product Catalog | Complete |
| PROD-05 | Phase 3: Product Catalog | Complete |
| PROD-06 | Phase 3: Product Catalog | Complete |
| PROD-07 | Phase 3: Product Catalog | Complete |
| PROD-08 | Phase 3: Product Catalog | Complete |
| PROD-09 | Phase 3: Product Catalog | Complete |
| PROD-10 | Phase 3: Product Catalog | Complete |
| CAT-01 | Phase 4: Categories & Navigation | Complete |
| CAT-02 | Phase 4: Categories & Navigation | Complete |
| CAT-03 | Phase 4: Categories & Navigation | Complete |
| CAT-04 | Phase 4: Categories & Navigation | Complete |
| CAT-05 | Phase 4: Categories & Navigation | Complete |
| CAT-06 | Phase 4: Categories & Navigation | Complete |
| CAT-07 | Phase 4: Categories & Navigation | Complete |
| SRCH-01 | Phase 5: Search System | Complete |
| SRCH-02 | Phase 5: Search System | Complete |
| SRCH-03 | Phase 5: Search System | Complete |
| SRCH-04 | Phase 5: Search System | Complete |
| SRCH-05 | Phase 5: Search System | Complete |
| SRCH-06 | Phase 5: Search System | Complete |
| FILT-01 | Phase 6: Filter System | Complete |
| FILT-02 | Phase 6: Filter System | Complete |
| FILT-03 | Phase 6: Filter System | Complete |
| FILT-04 | Phase 6: Filter System | Complete |
| FILT-05 | Phase 6: Filter System | Complete |
| FILT-06 | Phase 6: Filter System | Complete |
| FILT-07 | Phase 6: Filter System | Complete |
| PDPG-01 | Phase 7: Product Page | Complete |
| PDPG-02 | Phase 7: Product Page | Complete |
| PDPG-03 | Phase 7: Product Page | Complete |
| PDPG-04 | Phase 7: Product Page | Complete |
| PDPG-05 | Phase 7: Product Page | Complete |
| PDPG-06 | Phase 7: Product Page | Complete |
| PDPG-07 | Phase 7: Product Page | Complete |
| PDPG-08 | Phase 7: Product Page | Complete |
| PDPG-09 | Phase 7: Product Page | Complete |
| PDPG-10 | Phase 7: Product Page | Complete |
| WISH-01 | Phase 8: Wishlist & Compare | Complete |
| WISH-02 | Phase 8: Wishlist & Compare | Complete |
| WISH-03 | Phase 8: Wishlist & Compare | Complete |
| WISH-04 | Phase 8: Wishlist & Compare | Complete |
| WISH-05 | Phase 8: Wishlist & Compare | Complete |
| WISH-06 | Phase 8: Wishlist & Compare | Complete |
| CART-01 | Phase 9: Cart System | Complete |
| CART-02 | Phase 9: Cart System | Complete |
| CART-03 | Phase 9: Cart System | Complete |
| CART-04 | Phase 9: Cart System | Complete |
| CART-05 | Phase 9: Cart System | Complete |
| CART-06 | Phase 9: Cart System | Complete |
| CART-07 | Phase 9: Cart System | Complete |
| CART-08 | Phase 9: Cart System | Complete |
| CART-09 | Phase 9: Cart System | Complete |
| CHKT-01 | Phase 10: Checkout | Pending |
| CHKT-02 | Phase 10: Checkout | Pending |
| CHKT-03 | Phase 10: Checkout | Pending |
| CHKT-04 | Phase 10: Checkout | Pending |
| CHKT-05 | Phase 10: Checkout | Pending |
| CHKT-06 | Phase 10: Checkout | Pending |
| CHKT-07 | Phase 10: Checkout | Pending |
| CHKT-08 | Phase 10: Checkout | Pending |
| PAY-01 | Phase 11: Payments | Pending |
| PAY-02 | Phase 11: Payments | Pending |
| PAY-03 | Phase 11: Payments | Pending |
| PAY-04 | Phase 11: Payments | Pending |
| PAY-05 | Phase 11: Payments | Pending |
| PAY-06 | Phase 11: Payments | Pending |
| PAY-07 | Phase 11: Payments | Pending |
| ORD-01 | Phase 12: Order System | Pending |
| ORD-02 | Phase 12: Order System | Pending |
| ORD-03 | Phase 12: Order System | Pending |
| ORD-04 | Phase 12: Order System | Pending |
| ORD-05 | Phase 12: Order System | Pending |
| ORD-06 | Phase 12: Order System | Pending |
| ORD-07 | Phase 12: Order System | Pending |
| ORD-08 | Phase 12: Order System | Pending |
| ORD-09 | Phase 12: Order System | Pending |
| SHIP-01 | Phase 13: Shipping | Complete |
| SHIP-02 | Phase 13: Shipping | Complete |
| SHIP-03 | Phase 13: Shipping | Complete |
| SHIP-04 | Phase 13: Shipping | Complete |
| SHIP-05 | Phase 13: Shipping | Complete |
| SHIP-06 | Phase 13: Shipping | Complete |
| INV-01 | Phase 14: Inventory Management | Complete |
| INV-02 | Phase 14: Inventory Management | Complete |
| INV-03 | Phase 14: Inventory Management | Complete |
| INV-04 | Phase 14: Inventory Management | Complete |
| INV-05 | Phase 14: Inventory Management | Complete |
| INV-06 | Phase 14: Inventory Management | Complete |
| INV-07 | Phase 14: Inventory Management | Complete |
| INV-08 | Phase 14: Inventory Management | Complete |
| PRMO-01 | Phase 15: Promotions & Discounts | Pending |
| PRMO-02 | Phase 15: Promotions & Discounts | Pending |
| PRMO-03 | Phase 15: Promotions & Discounts | Pending |
| PRMO-04 | Phase 15: Promotions & Discounts | Pending |
| PRMO-05 | Phase 15: Promotions & Discounts | Pending |
| PRMO-06 | Phase 15: Promotions & Discounts | Pending |
| PRMO-07 | Phase 15: Promotions & Discounts | Pending |
| PRMO-08 | Phase 15: Promotions & Discounts | Pending |
| REV-01 | Phase 16: Reviews & Ratings | Pending |
| REV-02 | Phase 16: Reviews & Ratings | Pending |
| REV-03 | Phase 16: Reviews & Ratings | Pending |
| REV-04 | Phase 16: Reviews & Ratings | Pending |
| REV-05 | Phase 16: Reviews & Ratings | Pending |
| REV-06 | Phase 16: Reviews & Ratings | Pending |
| REV-07 | Phase 16: Reviews & Ratings | Pending |
| NOTF-01 | Phase 17: Notifications | Pending |
| NOTF-02 | Phase 17: Notifications | Pending |
| NOTF-03 | Phase 17: Notifications | Pending |
| NOTF-04 | Phase 17: Notifications | Pending |
| NOTF-05 | Phase 17: Notifications | Pending |
| NOTF-06 | Phase 17: Notifications | Pending |
| NOTF-07 | Phase 17: Notifications | Pending |
| NOTF-08 | Phase 17: Notifications | Pending |
| ANLT-01 | Phase 18: Analytics | Pending |
| ANLT-02 | Phase 18: Analytics | Pending |
| ANLT-03 | Phase 18: Analytics | Pending |
| ANLT-04 | Phase 18: Analytics | Pending |
| ANLT-05 | Phase 18: Analytics | Pending |
| ANLT-06 | Phase 18: Analytics | Pending |
| ANLT-07 | Phase 18: Analytics | Pending |
| SEO-01 | Phase 19: SEO | Pending |
| SEO-02 | Phase 19: SEO | Pending |
| SEO-03 | Phase 19: SEO | Pending |
| SEO-04 | Phase 19: SEO | Pending |
| SEO-05 | Phase 19: SEO | Pending |
| SEO-06 | Phase 19: SEO | Pending |
| SEO-07 | Phase 19: SEO | Pending |
| MSTR-01 | Phase 20: Multi-Store | Pending |
| MSTR-02 | Phase 20: Multi-Store | Pending |
| MSTR-03 | Phase 20: Multi-Store | Pending |
| MSTR-04 | Phase 20: Multi-Store | Pending |
| MSTR-05 | Phase 20: Multi-Store | Pending |
| MSTR-06 | Phase 20: Multi-Store | Pending |
| ADMN-01 | Phase 21: Admin Panel | Pending |
| ADMN-02 | Phase 21: Admin Panel | Pending |
| ADMN-03 | Phase 21: Admin Panel | Pending |
| ADMN-04 | Phase 21: Admin Panel | Pending |
| ADMN-05 | Phase 21: Admin Panel | Pending |
| ADMN-06 | Phase 21: Admin Panel | Pending |
| ADMN-07 | Phase 21: Admin Panel | Pending |
| ADMN-08 | Phase 21: Admin Panel | Pending |

**Coverage:**
- v1 requirements: 166 total
- Mapped to phases: 166
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
