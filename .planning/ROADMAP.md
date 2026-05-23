# Roadmap: Universal E-Commerce Template

## Overview

This roadmap delivers a production-ready, universal e-commerce template through 21 phases -- one per feature domain. The build order flows from foundational schema design through authentication, product catalog, discovery (search/filters), purchase flow (cart/checkout/payments), fulfillment (orders/shipping/inventory), engagement (promotions/reviews/notifications), and finally cross-cutting concerns (analytics/SEO/multi-store/admin). Each phase includes implementation across server, client, and admin apps where applicable. Research precedes every phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Database Schema Design** - Complete Prisma and Mongoose schemas for all entities with indexes, relations, and seed data
- [ ] **Phase 2: Authentication System** - Clerk-based auth with user management across server, client, and admin apps
- [ ] **Phase 3: Product Catalog** - Admin CRUD for all product types (simple, variable, weighted, digital, bundled) and client product listings
- [ ] **Phase 4: Categories & Navigation** - Infinite depth category tree, collections, brands, mega menu, and breadcrumbs
- [ ] **Phase 5: Search System** - Meilisearch integration with full-text search, autocomplete, and typo tolerance
- [x] **Phase 6: Filter System** - Dynamic attribute-based filters with price range, multi-select, and URL persistence (completed 2026-03-11)
- [x] **Phase 7: Product Page** - Full product detail pages with gallery, variant selector, specs, and type-specific displays (completed 2026-03-11)
- [x] **Phase 8: Wishlist & Compare** - Wishlist management with guest/auth sync and side-by-side product comparison (completed 2026-03-12)
- [x] **Phase 9: Cart System** - Persistent cart with guest/auth support, cart merge, coupon application, and mini cart (completed 2026-03-14)
- [ ] **Phase 10: Checkout** - Multi-step checkout flow with address selection, shipping methods, and order confirmation
- [ ] **Phase 11: Payments** - Stripe integration with card payments, Apple/Google Pay, webhooks, and refunds
- [ ] **Phase 12: Order System** - Order lifecycle management with tracking, invoices, returns, and saga consistency
- [x] **Phase 13: Shipping** - Shipping zones, methods, rate calculation, and tracking (completed 2026-03-11)
- [x] **Phase 14: Inventory Management** - Stock tracking, multi-warehouse, atomic reservations, and SKU management (completed 2026-03-11)
- [ ] **Phase 15: Promotions & Discounts** - Coupons, BOGO, tiered pricing, flash sales, and stackability rules
- [ ] **Phase 16: Reviews & Ratings** - User reviews with photos, moderation, helpfulness voting, and verified purchase badges
- [ ] **Phase 17: Notifications** - Transactional emails via Resend with React Email templates for all order lifecycle events
- [ ] **Phase 18: Analytics** - Admin analytics dashboard with revenue, conversion, best sellers, and customer insights
- [ ] **Phase 19: SEO** - Meta tags, canonical URLs, sitemap, structured data, and admin SEO field editing
- [ ] **Phase 20: Multi-Store** - Multi-language, multi-currency, locale detection, and admin translation management
- [ ] **Phase 21: Admin Panel** - Dashboard, RBAC, data tables, forms, activity log, and settings for all modules
- [x] **Phase 22: In-App Guidance & AI Assistant** - In-app guidance system and AI-powered assistant for admin and client apps (completed 2026-03-14)
- [ ] **Phase 23: E-Commerce UI Design System & Component Library** - Unified design system and reusable component library

## Phase Details

### Phase 1: Database Schema Design
**Goal**: All database schemas are production-ready with proper models, relations, indexes, and seed data so every subsequent phase can build on a solid data foundation
**Depends on**: Nothing (first phase)
**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06, SCHEMA-07, SCHEMA-08, SCHEMA-09, SCHEMA-10, SCHEMA-11, SCHEMA-12, SCHEMA-13
**Success Criteria** (what must be TRUE):
  1. Running `prisma db push` succeeds and creates all PostgreSQL tables (User, Product, ProductVariant, Category, Brand, Tag, Collection, Address, Wishlist, Review, Coupon, Promotion, ShippingZone, ShippingMethod, Warehouse, InventoryItem, CategoryAttribute) with correct relations and indexes
  2. Mongoose models (Order, Cart) can be instantiated with full lifecycle fields, and Cart documents auto-expire via TTL
  3. Running `prisma db seed` populates the database with realistic sample data covering all product types, categories at multiple depths, and related entities
  4. JSONB columns on Product have GIN indexes and Category model uses materialized path string for tree hierarchy
  5. All schemas have proper cascading deletes, unique constraints, and validation (no orphaned records possible)
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Prisma schema: Product catalog domain (Product with type discriminator, Category with materialized path, Variant EAV system, Brand/Tag/Collection)
- [x] 01-02-PLAN.md — Mongoose schemas: Order with full lifecycle and Cart with TTL expiration
- [x] 01-03-PLAN.md — Prisma schema: User/Commerce domain (User with SUPER_ADMIN, Address, Wishlist, Review, Coupon, Promotion, Shipping, Warehouse, Inventory)
- [ ] 01-04-PLAN.md — Seed data factories, seed script for both databases, and shared types update

### Phase 2: Authentication System
**Goal**: Users can securely register, login, and manage their accounts via Clerk, with role-based access controlling admin panel entry
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09
**Success Criteria** (what must be TRUE):
  1. User can register with email/password and login with Google/GitHub OAuth on the client app, with their account synced to the database via Clerk webhooks
  2. User sessions persist across browser refresh on both client and admin apps without re-login
  3. Admin app rejects access for users without ADMIN or SUPER_ADMIN role, showing an unauthorized page
  4. User can view and edit their profile (name, email, avatar) and manage saved addresses (add, edit, delete, set default) on the client app
  5. Admin can view the user list, view user details, change user roles, and disable accounts from the admin panel
**Plans**: 6 plans

Plans:
- [ ] 02-01-PLAN.md — Install Clerk SDKs, configure ClerkProvider in both Next.js apps, set up clerkMiddleware and auth helpers
- [ ] 02-02-PLAN.md — Integrate Clerk Express middleware in server, implement webhook-based user sync with Svix verification
- [ ] 02-03-PLAN.md — Create client sign-in/sign-up pages, admin sign-in page and unauthorized landing page
- [ ] 02-04-PLAN.md — Client user profile view/edit and address management (CRUD with default setting)
- [ ] 02-05-PLAN.md — Admin user management panel (user list, detail, role change, account disable/enable)

### Phase 3: Product Catalog
**Goal**: Admins can create and manage all five product types through the admin panel, and customers can browse product listings with sorting and pagination on the client app
**Depends on**: Phase 2
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06, PROD-07, PROD-08, PROD-09, PROD-10
**Success Criteria** (what must be TRUE):
  1. Admin can create each product type (simple, variable, weighted, digital, bundled) through dedicated forms with all type-specific fields
  2. Admin can upload, reorder, crop, and manage product images via Cloudinary integration with drag-and-drop
  3. Admin can set product status (draft, active, archived) and control visibility, with only active products showing on the client
  4. Client app displays paginated product listings sortable by price, name, date, and popularity, with product cards showing image, name, price, rating, and quick-add-to-cart
  5. Admin can perform bulk operations: CSV import, bulk status change, and bulk delete
**Plans**: 7 plans

Plans:
- [x] 03-00-PLAN.md — Wave 0: Install Vitest, create test configuration, setup file with Prisma mocks, and 10 placeholder test files for all requirements
- [x] 03-01-PLAN.md — Zod validation schemas (discriminated union for all 5 product types) and expanded server product API with type-aware CRUD, slug generation, status management
- [x] 03-02-PLAN.md — Cloudinary signed upload endpoint and reusable ImageManager component with drag-and-drop reordering
- [x] 03-03-PLAN.md — Admin product list page with TanStack Table (sorting, filtering, search, pagination, status badges, row actions, bulk operations)
- [x] 03-04-PLAN.md — Admin product creation/edit form with React Hook Form, Zod discriminated union validation, all 5 type-specific field groups, and image manager integration
- [x] 03-05-PLAN.md — Client product listing page with responsive grid, product cards (image, name, price, rating, add-to-cart), sorting, and pagination
- [x] 03-06-PLAN.md — Bulk product operations: CSV import with Papa Parse streaming validation, multer upload middleware

### Phase 4: Categories & Navigation
**Goal**: Products are organized in an infinite-depth category tree with collections, brands, and tags, and customers can navigate via mega menu and breadcrumbs
**Depends on**: Phase 3
**Requirements**: CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06, CAT-07
**Success Criteria** (what must be TRUE):
  1. Admin can create, edit, and reorder categories at any depth using drag-and-drop tree interface, with materialized path updating correctly
  2. Admin can assign dynamic filterable attributes to categories (e.g., "Screen Size" for Electronics > TVs) and manage collections, brands, and tags
  3. Client app renders a mega menu from the category tree showing top 2-3 levels, and breadcrumbs display the full category path on category and product pages
  4. Client app displays category pages showing products within the category (including subcategory products), subcategory links, and applied filters
  5. Categories support SEO fields (slug, meta title, meta description, custom URL) editable by admin
**Plans**: 6 plans

Plans:
- [ ] 04-00-PLAN.md — Wave 0: Extend Vitest setup with category domain mocks, create test stubs for CAT-01 through CAT-07
- [ ] 04-01-PLAN.md — Server category module: Zod schemas, category tree CRUD service (create, move, reorder with materialized path), attribute management, REST API endpoints
- [ ] 04-02-PLAN.md — Server collection/brand/tag modules: CRUD services and routes, admin and client API client extensions
- [ ] 04-03-PLAN.md — Admin category tree UI: drag-and-drop tree with @minoru/react-dnd-treeview, category create/edit form with SEO fields, attribute manager
- [ ] 04-04-PLAN.md — Admin collections/brands/tags UI: CRUD tables and forms with product assignment for collections
- [ ] 04-05-PLAN.md — Client mega menu, breadcrumbs with JSON-LD, category page with products/subcategories and dynamic SEO metadata

### Phase 5: Search System
**Goal**: Customers can find products instantly via search-as-you-type with typo tolerance, and admins can configure search behavior
**Depends on**: Phase 3
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, SRCH-05, SRCH-06
**Success Criteria** (what must be TRUE):
  1. Meilisearch instance is running (via Docker Compose) and product catalog is synced automatically when products are created, updated, or deleted
  2. Client app search bar provides autocomplete suggestions as the user types, with results appearing in under 100ms
  3. Search finds products across name, description, SKU, brand, and category fields, with typo tolerance and synonym support
  4. Search results include facet counts that can drive dynamic filtering on the results page
  5. Admin can configure search settings (synonyms, stop words, ranking rules) from the admin panel
**Plans**: 6 plans

Plans:
- [ ] 05-00-PLAN.md — Wave 0: Meilisearch mock in test setup, search fixtures, test stubs for SRCH-01 through SRCH-06
- [ ] 05-01-PLAN.md — Meilisearch Docker Compose service, SearchService with index config, SyncService with event-driven product sync
- [ ] 05-02-PLAN.md — Search API endpoints (public search, admin settings) and server startup initialization
- [ ] 05-03-PLAN.md — Client SearchBar with InstantSearch autocomplete and search results page with faceted filtering
- [ ] 05-04-PLAN.md — Admin search settings page: synonyms, stop words, ranking rules management, and full re-sync trigger

### Phase 6: Filter System
**Goal**: Customers can narrow product listings using dynamic attribute-based filters with URL persistence, enabling shareable and bookmarkable filtered views
**Depends on**: Phase 4, Phase 5
**Requirements**: FILT-01, FILT-02, FILT-03, FILT-04, FILT-05, FILT-06, FILT-07
**Success Criteria** (what must be TRUE):
  1. Category pages show dynamic filters derived from the category's assigned attributes (e.g., screen size, resolution for TVs) with product counts per filter value
  2. Price range filter works with both slider and min/max input fields, and availability filter shows in-stock/out-of-stock/pre-order options
  3. Filters use OR logic within groups (selecting red OR blue shows both) and AND logic across groups (selecting red AND size:large narrows results)
  4. All filter state persists in URL parameters -- copying and pasting the URL reproduces the exact filtered view
  5. On mobile, filters open in a full-screen modal with apply and clear buttons
**Plans**: 6 plans

Plans:
- [ ] 06-00-PLAN.md — Wave 0: Test stubs for all FILT-01 through FILT-07 requirements (server filter logic + client filter components)
- [ ] 06-01-PLAN.md — Server-side filtering: filterProducts with JSONB OR/AND logic, getFacetCounts aggregation, filter/facets API endpoints
- [ ] 06-02-PLAN.md — Client filter components: nuqs useFilters hook, PriceFilter slider+inputs, AttributeFilter, AvailabilityFilter, ActiveFilters
- [ ] 06-03-PLAN.md — Responsive filter layout: FilterContent, FilterSidebar (desktop), FilterDrawer (mobile Sheet with apply/clear)
- [ ] 06-04-PLAN.md — Category page integration: wire searchParams to server filter API, render filters alongside product grid with facet counts
- [ ] 06-05-PLAN.md — Gap closure: pre-order availability filter (FILT-07) and dynamic priceRange

### Phase 7: Product Page
**Goal**: Each product type has a rich, dedicated detail page with image gallery, variant selection, specifications, related products, and type-specific displays
**Depends on**: Phase 3, Phase 4
**Requirements**: PDPG-01, PDPG-02, PDPG-03, PDPG-04, PDPG-05, PDPG-06, PDPG-07, PDPG-08, PDPG-09, PDPG-10
**Success Criteria** (what must be TRUE):
  1. Product page displays an image gallery with thumbnails, zoom on hover, and fullscreen lightbox navigation
  2. Variable products show variant selectors (dropdowns or color swatches) that dynamically update the displayed price, images, and stock status
  3. Product page shows a specifications/attributes table and a related products carousel
  4. "Frequently bought together" section shows complementary products with a one-click add-all-to-cart button
  5. Type-specific displays work correctly: weighted products show unit price calculator, digital products show file info and delivery method, bundle products show included items with price comparison
**Plans**: 6 plans

Plans:
- [ ] 07-01-PLAN.md — Foundation: test stubs, ProductDetail type, server related/FBT endpoints, client API extensions, Cloudinary config
- [ ] 07-02-PLAN.md — Image gallery with hero, thumbnails, hover zoom, mobile carousel, and fullscreen lightbox
- [ ] 07-03-PLAN.md — Variant selector with dropdown menus, stock status display, and add-to-cart button
- [ ] 07-04-PLAN.md — Type-specific displays: weighted quantity selector, digital product info, bundle items list
- [ ] 07-05-PLAN.md — Specs table, reviews placeholder, related products carousel, frequently bought together
- [ ] 07-06-PLAN.md — Product page assembly: Server Component wiring all sub-components, loading skeleton, not-found page

### Phase 8: Wishlist & Compare
**Goal**: Users can save products to a wishlist and compare products side-by-side, with guest support and notifications for price changes
**Depends on**: Phase 7
**Requirements**: WISH-01, WISH-02, WISH-03, WISH-04, WISH-05, WISH-06
**Success Criteria** (what must be TRUE):
  1. User can add and remove products to wishlist from both product cards and product detail pages via a heart icon toggle
  2. Wishlist persists in localStorage for guest users and syncs to the database when the user logs in, with no data loss
  3. Wishlist page shows all saved products with product cards and quick-add-to-cart buttons
  4. User can select 2-4 products for comparison, and the compare page shows a side-by-side specification table with differences highlighted
  5. User receives notifications when a wishlisted item has a price drop or comes back in stock
**Plans**: 6 plans

Plans:
- [ ] 08-00-PLAN.md — Wave 0: Prisma schema migration (priceAtAdd), types update, test infrastructure with mocks, fixtures, and stubs
- [ ] 08-01-PLAN.md — Server wishlist module: Zod validation, WishlistService CRUD + sync + notify prefs, controller, routes, server wiring
- [ ] 08-02-PLAN.md — Client Zustand stores (wishlist localStorage + compare sessionStorage), WishlistButton heart overlay, CompareBar, ProductCard integration
- [ ] 08-03-PLAN.md — Wishlist page with product grid, price-drop badges, guest-to-auth sync hook, product detail toggle, header badge
- [ ] 08-04-PLAN.md — Compare page with side-by-side specification table and difference highlighting
- [ ] 08-05-PLAN.md — EventBus listeners for price drop and restock detection on wishlisted items

### Phase 9: Cart System
**Goal**: Users can build and manage a shopping cart that persists across sessions with guest/auth support, cart merging, and real-time price calculation
**Depends on**: Phase 7
**Requirements**: CART-01, CART-02, CART-03, CART-04, CART-05, CART-06, CART-07, CART-08, CART-09
**Success Criteria** (what must be TRUE):
  1. User can add products to cart with selected variant and quantity, update quantities, remove items, and clear the entire cart
  2. Cart works for guest users (localStorage/cookie backed) and authenticated users (database backed), with guest cart merging into the authenticated cart on login
  3. Cart persists across browser sessions -- closing and reopening the browser retains cart contents
  4. Cart page shows real-time price calculation (subtotal, tax estimate, shipping estimate) and user can apply coupon codes with validation feedback
  5. Mini cart (slide-out panel) is accessible from the header on all pages, and cart validates stock availability before checkout with warnings for low/out-of-stock items
**Plans**: 5 plans

Plans:
- [ ] 09-00-PLAN.md — Wave 0: Cart test infrastructure with coupon Prisma mock, fixtures, and test stubs for all CART requirements
- [ ] 09-01-PLAN.md — Server cart module: Zod validation, CartService CRUD, guest-to-auth merge, coupon validation, stock check, controller, routes
- [ ] 09-02-PLAN.md — Zustand store extension (coupon state), useCartSync hook, api.cart client, server route wiring, EventMap extension
- [ ] 09-03-PLAN.md — Mini cart drawer: CartHeaderButton with badge, MiniCartDrawer slide-out, CartItemRow, layout integration
- [ ] 09-04-PLAN.md — Cart page: CouponSection with validation feedback, PriceSummary breakdown, StockWarning badges, full cart page route

### Phase 10: Checkout
**Goal**: Users can complete a purchase through a guided multi-step checkout flow with guest support and mobile optimization
**Depends on**: Phase 9, Phase 13
**Requirements**: CHKT-01, CHKT-02, CHKT-03, CHKT-04, CHKT-05, CHKT-06, CHKT-07, CHKT-08
**Success Criteria** (what must be TRUE):
  1. Checkout flow guides the user through five steps: Information > Shipping > Payment > Review > Confirmation
  2. User can select from saved addresses or enter a new shipping/billing address, with guest checkout supported via email collection
  3. Shipping method selection shows calculated rates per available method based on cart contents and destination (consumes Phase 13's POST /api/shipping/calculate endpoint)
  4. Order summary is visible throughout checkout showing item details and a running total that updates with shipping and tax
  5. Checkout validates stock availability, reserves inventory during payment processing, and shows an order confirmation page with order number, summary, and estimated delivery
**Plans**: TBD (estimated 7-9)

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD
- [ ] 10-03: TBD
- [ ] 10-04: TBD
- [ ] 10-05: TBD
- [ ] 10-06: TBD
- [ ] 10-07: TBD

### Phase 11: Payments
**Goal**: Payments are processed securely via Stripe with card and wallet support, webhook-driven status updates, and admin refund capability
**Depends on**: Phase 10
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07
**Success Criteria** (what must be TRUE):
  1. User can pay with credit/debit card via Stripe payment intent flow, with server-side price recalculation (never trusting client prices)
  2. Apple Pay and Google Pay work via Stripe Payment Request Button on supported devices
  3. Stripe webhooks (with raw body signature verification) correctly process payment succeeded, failed, and refunded events
  4. Payment status is reflected in order lifecycle -- successful payment moves order from pending to paid
  5. Admin can issue full or partial refunds from the order detail page in the admin panel
**Plans**: TBD (estimated 5-7)

Plans:
- [ ] 11-01: TBD
- [ ] 11-02: TBD
- [ ] 11-03: TBD
- [ ] 11-04: TBD
- [ ] 11-05: TBD

### Phase 12: Order System
**Goal**: Orders flow through a complete lifecycle with customer visibility, admin management, invoices, returns, and cross-database consistency
**Depends on**: Phase 11
**Requirements**: ORD-01, ORD-02, ORD-03, ORD-04, ORD-05, ORD-06, ORD-07, ORD-08, ORD-09
**Success Criteria** (what must be TRUE):
  1. Successful checkout creates an order with a unique order number, and the order follows the lifecycle: pending > paid > processing > shipped > delivered (with cancel and return paths)
  2. Customer can view order history with status and items on the client app, and drill into a detailed order page showing a timeline of status changes
  3. Customer can request a return/refund with reason selection and optional photo upload
  4. Admin can view all orders with filtering (status, date, customer, amount), update order status, add tracking numbers, and add internal notes
  5. PDF invoices are generated for each order, and saga pattern ensures consistency between PostgreSQL (product/inventory updates) and MongoDB (order document)
**Plans**: TBD (estimated 7-9)

Plans:
- [ ] 12-01: TBD
- [ ] 12-02: TBD
- [ ] 12-03: TBD
- [ ] 12-04: TBD
- [ ] 12-05: TBD
- [ ] 12-06: TBD
- [ ] 12-07: TBD

### Phase 13: Shipping
**Goal**: Admins can configure shipping zones and methods, and the shipping rate calculation API is available for checkout integration (Phase 10 consumes this API for the checkout shipping step)
**Depends on**: Phase 1
**Requirements**: SHIP-01, SHIP-02, SHIP-03, SHIP-04, SHIP-05, SHIP-06
**Success Criteria** (what must be TRUE):
  1. Admin can define shipping zones as geographic regions and configure multiple shipping methods per zone (flat rate, weight-based, free above threshold)
  2. POST /api/shipping/calculate accepts cart weight, destination, and returns available shipping methods with calculated rates (SHIP-03 API foundation -- the checkout UI that calls this endpoint is Phase 10, CHKT-03)
  3. Admin can add tracking numbers to orders with carrier selection (USPS, FedEx, UPS, DHL, etc.)
  4. Customer can track shipment status from the order detail page on the client app
  5. Free shipping threshold is configurable per zone and correctly applies when cart total exceeds the threshold
**Plans**: 6 plans

Plans:
- [x] 13-00-PLAN.md — Wave 0: Extend Vitest setup with shipping Prisma mocks, create test fixtures and test stubs for SHIP-01 through SHIP-06
- [x] 13-01-PLAN.md — Server shipping module: Zod validation, zone/method CRUD service, zone matching algorithm, rate calculation engine, REST API endpoints
- [x] 13-02-PLAN.md — Order tracking: addTracking method on OrderService, order.shipped event, PATCH /orders/:id/tracking endpoint
- [x] 13-03-PLAN.md — Admin shipping zone/method management UI: zone list, zone detail with methods, create/edit forms for both
- [x] 13-04-PLAN.md — Admin order tracking form and client order tracking display with carrier-specific tracking URLs

### Phase 14: Inventory Management
**Goal**: Stock is tracked at the variant/SKU level across multiple warehouses with atomic reservations preventing overselling
**Depends on**: Phase 3
**Requirements**: INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, INV-07, INV-08
**Success Criteria** (what must be TRUE):
  1. Stock is tracked per SKU (variant-level) with real-time quantities, and low stock alerts fire when quantity drops below a configurable threshold
  2. Admin can manage multiple warehouses with location and priority, and stock is allocated per warehouse with intelligent routing to the nearest warehouse
  3. Atomic stock reservation with 15-minute TTL holds inventory during checkout, commits on successful payment, and releases on abandonment
  4. Admin inventory dashboard shows stock levels across all warehouses, active alerts, and movement history with reason tracking (sale, return, manual adjustment, damage)
  5. SKU auto-generation based on product attributes produces unique, predictable identifiers
**Plans**: 5 plans

Plans:
- [ ] 14-00-PLAN.md — Wave 0: Extend Vitest setup with inventory Prisma mocks, create test fixtures and test stubs for INV-01 through INV-08
- [ ] 14-01-PLAN.md — InventoryService with stock tracking, warehouse CRUD, nearest-warehouse routing, movement history, low stock alerts, SKU auto-generation, and Zod validation schemas
- [ ] 14-02-PLAN.md — Atomic stock reservation with Prisma $transaction, commit/release methods, and node-cron TTL cleanup job
- [ ] 14-03-PLAN.md — Express controller, routes (/api/inventory), server wiring with cron startup, and admin API client extension
- [ ] 14-04-PLAN.md — Admin inventory dashboard, warehouse management UI, movement history page, and manual stock adjustment form

### Phase 15: Promotions & Discounts
**Goal**: Admins can create and manage diverse promotion types with configurable conditions, limits, and stackability rules
**Depends on**: Phase 9
**Requirements**: PRMO-01, PRMO-02, PRMO-03, PRMO-04, PRMO-05, PRMO-06, PRMO-07, PRMO-08
**Success Criteria** (what must be TRUE):
  1. Admin can create coupon codes with three discount types (percentage, fixed amount, free shipping) and set conditions (min cart total, specific products/categories, customer segments)
  2. Admin can set coupon limits (usage count, per-customer limit, expiration date) and the system enforces them at application time
  3. BOGO promotions work with configurable buy/get quantities, and bulk/tiered pricing automatically applies (buy 3+ get 10% off)
  4. Flash sales display countdown timers on the client app with scheduled start/end times, and stackable vs non-stackable promotion rules are enforced correctly
  5. Admin promotions dashboard shows active, scheduled, and expired promotions with performance metrics (usage count, revenue impact)
**Plans**: TBD (estimated 7-9)

Plans:
- [ ] 15-01: TBD
- [ ] 15-02: TBD
- [ ] 15-03: TBD
- [ ] 15-04: TBD
- [ ] 15-05: TBD
- [ ] 15-06: TBD
- [ ] 15-07: TBD

### Phase 16: Reviews & Ratings
**Goal**: Customers can leave verified reviews with photos, and admins can moderate them, building social proof on product pages
**Depends on**: Phase 7, Phase 12
**Requirements**: REV-01, REV-02, REV-03, REV-04, REV-05, REV-06, REV-07
**Success Criteria** (what must be TRUE):
  1. Authenticated user who has purchased a product can submit a star rating (1-5) and written review, with optional photo uploads
  2. Product page shows average rating, rating distribution bar chart, and paginated reviews sortable by date, rating, and helpfulness
  3. Users can mark reviews as helpful, and helpful count influences sort order
  4. Admin moderation queue shows new reviews for approval, rejection, or flagging
  5. Reviews from confirmed buyers display a "Verified Purchase" badge
**Plans**: TBD (estimated 5-7)

Plans:
- [ ] 16-01: TBD
- [ ] 16-02: TBD
- [ ] 16-03: TBD
- [ ] 16-04: TBD
- [ ] 16-05: TBD

### Phase 17: Notifications
**Goal**: All transactional emails are sent automatically via Resend with professionally designed React Email templates covering the full order lifecycle
**Depends on**: Phase 12
**Requirements**: NOTF-01, NOTF-02, NOTF-03, NOTF-04, NOTF-05, NOTF-06, NOTF-07, NOTF-08
**Success Criteria** (what must be TRUE):
  1. Resend is integrated with React Email templates, and a welcome email sends on registration
  2. Order confirmation email sends automatically with complete order details after successful checkout
  3. Shipping confirmation email sends with tracking info when tracking number is added, and status update emails send for processing and delivered transitions
  4. Abandoned cart recovery email sequence fires at 1hr, 24hr, and 72hr intervals for carts with items but no checkout completion
  5. Low stock alert emails send to admin when inventory drops below threshold, and admin can preview and customize email templates
**Plans**: 5 plans

Plans:
- [ ] 17-01: TBD
- [ ] 17-02: TBD
- [ ] 17-03: TBD
- [ ] 17-04: TBD
- [ ] 17-05: TBD
- [ ] 17-06: TBD

### Phase 18: Analytics
**Goal**: Admins have a data-driven dashboard showing revenue, conversion, product performance, and customer insights with date filtering and export
**Depends on**: Phase 12
**Requirements**: ANLT-01, ANLT-02, ANLT-03, ANLT-04, ANLT-05, ANLT-06, ANLT-07
**Success Criteria** (what must be TRUE):
  1. Admin dashboard shows revenue metrics (daily, weekly, monthly) with year-over-year comparison charts
  2. Conversion funnel visualization shows drop-off between visits > cart > checkout > purchase
  3. Best-selling products and categories are displayed with ranking and revenue contribution
  4. Customer insights show new vs returning customers, top customers by spend, and average order value
  5. All analytics views support date range selection and CSV export, and client app has Google Analytics 4 and PostHog integrations installed
**Plans**: TBD (estimated 5-7)

Plans:
- [ ] 18-01: TBD
- [ ] 18-02: TBD
- [ ] 18-03: TBD
- [ ] 18-04: TBD
- [ ] 18-05: TBD

### Phase 19: SEO
**Goal**: The client app is fully optimized for search engines with dynamic meta tags, structured data, sitemaps, and admin-editable SEO fields
**Depends on**: Phase 4, Phase 7
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07
**Success Criteria** (what must be TRUE):
  1. All client pages render dynamic meta tags (title, description, Open Graph) appropriate to the page content
  2. Products, categories, and collections use SEO-friendly URLs with slugs, and canonical URLs prevent duplicate content from filters and pagination
  3. XML sitemap is auto-generated including all product and category pages, and robots.txt is configured with noindex for filter parameter pages
  4. JSON-LD structured data (Product, ProductGroup, BreadcrumbList, Organization) is rendered on appropriate pages and validates in Google Rich Results Test
  5. Admin can edit SEO fields (meta title, description, slug) per product and category from the admin panel
**Plans**: TBD (estimated 5-7)

Plans:
- [ ] 19-01: TBD
- [ ] 19-02: TBD
- [ ] 19-03: TBD
- [ ] 19-04: TBD
- [ ] 19-05: TBD

### Phase 20: Multi-Store
**Goal**: The template supports multiple languages and currencies with locale detection, translation management, and locale-aware price formatting
**Depends on**: Phase 3, Phase 4
**Requirements**: MSTR-01, MSTR-02, MSTR-03, MSTR-04, MSTR-05, MSTR-06
**Success Criteria** (what must be TRUE):
  1. i18n framework is integrated and content (products, categories, static text) can be translated per locale
  2. Multi-currency support works with a currency selector, real-time exchange rates, and prices formatted according to locale conventions (symbol placement, decimal separator)
  3. Locale detection automatically redirects users based on browser settings or IP geolocation
  4. Admin can manage translations for products, categories, and static content, and configure available languages and currencies
  5. Price formatting respects locale conventions across all pages (product listings, product page, cart, checkout)
**Plans**: TBD (estimated 5-7)

Plans:
- [ ] 20-01: TBD
- [ ] 20-02: TBD
- [ ] 20-03: TBD
- [ ] 20-04: TBD
- [ ] 20-05: TBD

### Phase 21: Admin Panel
**Goal**: The admin panel is a complete, polished management interface with dashboard KPIs, RBAC, reusable data tables/forms, activity logging, and store settings
**Depends on**: Phase 2, Phase 18
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05, ADMN-06, ADMN-07, ADMN-08
**Success Criteria** (what must be TRUE):
  1. Admin dashboard shows KPI cards (revenue, orders, customers, conversion rate) with real data from all modules
  2. Sidebar navigation is organized by module with collapsible sections, and the layout is responsive on tablet and desktop
  3. Role-based access control enforces permissions: SUPER_ADMIN sees everything, ADMIN has configurable module-level permissions
  4. Reusable data table component supports sorting, filtering, pagination, and bulk actions across all entity types, and reusable form component supports validation, image upload, and rich text editing
  5. Activity log shows who changed what and when, and settings page allows store configuration (name, logo, contact, tax rates, policies)
**Plans**: 5 plans

Plans:
- [ ] 21-01: TBD
- [ ] 21-02: TBD
- [ ] 21-03: TBD
- [ ] 21-04: TBD
- [ ] 21-05: TBD
- [ ] 21-06: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 > 2 > 3 > 4 > 5 > 6 > 7 > 8 > 9 > 10 > 11 > 12 > 13 > 14 > 15 > 16 > 17 > 18 > 19 > 20 > 21 > 22 > 23

Note: Some phases share dependencies and could theoretically run in parallel (e.g., Phase 5 and Phase 7 both depend on Phase 3). The linear order above is the recommended solo-developer sequence.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Database Schema Design | 0/4 | Planning complete | - |
| 2. Authentication System | 0/5 | Planning complete | - |
| 3. Product Catalog | 6/7 | In Progress|  |
| 4. Categories & Navigation | 0/6 | Planning complete | - |
| 5. Search System | 0/5 | Planning complete | - |
| 6. Filter System | 6/6 | Complete   | 2026-03-11 |
| 7. Product Page | 6/6 | Complete   | 2026-03-11 |
| 8. Wishlist & Compare | 6/6 | Complete   | 2026-03-12 |
| 9. Cart System | 5/5 | Complete   | 2026-03-14 |
| 10. Checkout | 0/7 | Not started | - |
| 11. Payments | 0/5 | Not started | - |
| 12. Order System | 0/7 | Not started | - |
| 13. Shipping | 5/5 | Complete    | 2026-03-11 |
| 14. Inventory Management | 5/5 | Complete    | 2026-03-11 |
| 15. Promotions & Discounts | 0/7 | Not started | - |
| 16. Reviews & Ratings | 0/5 | Not started | - |
| 17. Notifications | 0/6 | Not started | - |
| 18. Analytics | 0/5 | Not started | - |
| 19. SEO | 0/5 | Not started | - |
| 20. Multi-Store | 0/5 | Not started | - |
| 21. Admin Panel | 0/6 | Not started | - |
| 22. In-App Guidance & AI Assistant | 5/5 | Complete    | 2026-03-14 |
| 23. UI Design System & Component Library | 0/5 | Planning complete | - |

### Phase 22: In-App Guidance & AI Assistant

**Goal:** Both client and admin apps have AI-powered chat assistants (Vercel AI SDK with streaming) and in-app guidance (Driver.js tours with contextual help tooltips) so users get instant help and first-time onboarding
**Requirements**: GUIDE-01, GUIDE-02, GUIDE-03, GUIDE-04, GUIDE-05, GUIDE-06
**Depends on:** Phase 21
**Success Criteria** (what must be TRUE):
  1. Client app has a floating AI shopping assistant that streams responses about products, shipping, and returns via Vercel AI SDK
  2. Admin app has an AI helper that answers how-to questions about admin panel features
  3. Both AI chat endpoints are rate-limited to prevent API cost abuse
  4. Driver.js tours provide first-time onboarding for client homepage and admin dashboard, with completion persisted in localStorage
  5. HelpTooltip components provide contextual inline help on forms and settings
**Plans**: 5 plans

Plans:
- [x] 22-00-PLAN.md — Wave 0: Install AI SDK and Driver.js packages, create test stubs for all Phase 22 behaviors (completed 2026-03-14)
- [ ] 22-01-PLAN.md — Client AI shopping assistant: chat API route with rate limiting and ChatWidget components
- [ ] 22-02-PLAN.md — Admin AI helper: chat API route with admin system prompt and AdminChatWidget components
- [ ] 22-03-PLAN.md — Guidance system: HelpTooltip, useTour hook with Driver.js, tour step definitions for client and admin
- [ ] 22-04-PLAN.md — Integration: wire ChatWidget into client layout, AdminChatWidget into admin layout, visual verification

### Phase 23: E-Commerce UI Design System & Component Library

**Goal:** The client app has a unified minimalist luxury design system with Tailwind v4 theme tokens, reusable UI primitives, polished layout (header/footer), landing page sections, and redesigned product listing components
**Requirements**: DS-01, DS-02, DS-03, DS-04, DS-05, DS-06, DS-07
**Depends on:** Phase 22
**Success Criteria** (what must be TRUE):
  1. Tailwind v4 @theme defines OKLCH color tokens, typography scale, and transition curves for consistent luxury aesthetic
  2. 10+ UI primitive components (Button, Input, Badge, Sheet, Dialog, Toast, Skeleton, Accordion, Spinner, VisuallyHidden) are available with variant props and className overrides
  3. Site header has transparent-to-solid scroll behavior, announcement bar, and mobile navigation drawer
  4. Homepage displays hero sections, category grid, product carousels, trust bar, and newsletter signup
  5. Product cards use no border/shadow/radius, crossfade image on hover, badges, and hover-revealed quick-add
  6. Global utilities (BackToTop, CookieConsent, Toaster) are wired into the root layout
**Plans**: 5 plans

Plans:
- [ ] 23-01-PLAN.md — Design tokens (Tailwind v4 @theme), cn() utility, and 10 UI primitive components
- [ ] 23-02-PLAN.md — Layout system: SiteHeader with scroll behavior, AnnouncementBar, MobileMenuDrawer, SiteFooter
- [ ] 23-03-PLAN.md — Landing page sections (HeroFullBleed, CategoryGrid, ProductCarousel, TrustBar, NewsletterSignup) and homepage assembly
- [ ] 23-04-PLAN.md — Product card and listing redesign: crossfade hover, badges, quick-add, color swatches, tight grid
- [ ] 23-05-PLAN.md — Shared utilities (BackToTop, EmptyState, CookieConsent) and product detail enhancements (ProductAccordion, StockIndicator, DeliveryEstimate)
