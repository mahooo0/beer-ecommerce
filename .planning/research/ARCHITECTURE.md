# Architecture Research

**Domain:** E-Commerce Platform
**Researched:** 2026-03-10
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Client  │  │  Admin  │  │  Mobile │  │   API   │        │
│  │   App   │  │   App   │  │   Web   │  │ Gateway │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       └─────────────┴────────────┴────────────┘             │
├─────────────────────────────────────────────────────────────┤
│                      API GATEWAY LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │    Request Routing │ Authentication │ Rate Limiting │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Product │  │  Order  │  │Inventory│  │ Payment │        │
│  │ Service │  │ Service │  │ Service │  │ Service │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│  ┌────┴────┐  ┌───┴─────┐  ┌───┴─────┐  ┌───┴─────┐        │
│  │Promotion│  │  Auth   │  │ Search  │  │Customer │        │
│  │ Service │  │ Service │  │ Service │  │ Service │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       └─────────────┴────────────┴────────────┘             │
├─────────────────────────────────────────────────────────────┤
│                      EVENT BUS LAYER                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ order.created │ payment.completed │ inventory.updated│    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    DATA PERSISTENCE LAYER                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │   MongoDB    │  │    Redis     │       │
│  │(Products/Cat)│  │   (Orders)   │  │(Cache/Session)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Product Service | Product CRUD, category tree, variant management, dynamic attributes | Express controller/service with Prisma ORM accessing PostgreSQL |
| Order Service | Order lifecycle, checkout flow, order history | Express controller/service with Mongoose ODM accessing MongoDB |
| Inventory Service | Multi-warehouse stock tracking, stock reservation, low-stock alerts | Express service with atomic operations on PostgreSQL, event-driven updates |
| Payment Service | Stripe integration, payment processing, refunds, webhooks | Express service with Stripe SDK, idempotent payment handling |
| Promotion Service | Coupon codes, discount rules, promotion engine, rule evaluation | Express service with rule engine, PostgreSQL for rule storage |
| Auth Service | Clerk integration, session management, role-based access | Express middleware with Clerk SDK, JWT validation |
| Search Service | Algolia/Meilisearch integration, autocomplete, faceted search | Express proxy to search provider, index synchronization events |
| Customer Service | User profiles, wishlists, addresses, preferences | Express service with Prisma ORM accessing PostgreSQL |
| API Gateway | Request routing, single entry point, response aggregation | Express app with route mounting, CORS, rate limiting middleware |
| Event Bus | Cross-service communication, decoupled event handling | Typed EventEmitter with strongly-typed event definitions |

## Recommended Project Structure

Current monorepo structure is sound. Key additions for new features:

```
apps/
├── server/src/
│   ├── modules/
│   │   ├── product/
│   │   │   ├── product.routes.ts        # HTTP routes
│   │   │   ├── product.controller.ts    # Request handlers
│   │   │   ├── product.service.ts       # Business logic
│   │   │   └── product.validator.ts     # Zod schemas
│   │   ├── category/                    # New module
│   │   │   ├── category.routes.ts
│   │   │   ├── category.controller.ts
│   │   │   ├── category.service.ts      # Category tree operations
│   │   │   └── category.validator.ts
│   │   ├── inventory/                   # New module
│   │   │   ├── inventory.routes.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── inventory.service.ts     # Stock reservation logic
│   │   │   └── warehouse.service.ts     # Multi-warehouse operations
│   │   └── promotion/                   # New module
│   │       ├── promotion.routes.ts
│   │       ├── promotion.controller.ts
│   │       ├── promotion.service.ts
│   │       └── rules/                   # Promotion rule engine
│   │           ├── rule-engine.ts
│   │           ├── discount-calculator.ts
│   │           └── validators.ts
│   └── common/
│       └── events/
│           └── event-definitions.ts     # Typed event contracts
├── client/src/
│   ├── app/
│   │   ├── products/[slug]/
│   │   │   └── page.tsx                 # Product detail page
│   │   ├── categories/[...path]/
│   │   │   └── page.tsx                 # Category navigation
│   │   └── checkout/
│   │       └── page.tsx                 # Checkout flow
│   ├── components/
│   │   ├── product/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── VariantSelector.tsx
│   │   │   └── AttributeFilters.tsx
│   │   └── shared/                      # Shared with admin
│   │       ├── CategoryTree.tsx         # Reusable tree component
│   │       └── AttributeDisplay.tsx
│   └── stores/
│       ├── cart-store.ts                # Existing
│       └── filter-store.ts              # New: URL-synced filters
└── admin/src/
    ├── app/
    │   ├── products/
    │   │   ├── page.tsx                 # Product list
    │   │   ├── new/page.tsx             # Product creation
    │   │   └── [id]/edit/page.tsx       # Product editing
    │   ├── categories/
    │   │   └── page.tsx                 # Category tree management
    │   ├── inventory/
    │   │   └── page.tsx                 # Multi-warehouse inventory
    │   └── promotions/
    │       └── page.tsx                 # Promotion rule builder
    └── components/
        ├── product/
        │   ├── VariantBuilder.tsx       # SKU generation UI
        │   └── AttributeManager.tsx     # Dynamic attribute editor
        └── shared/                      # Import from client/components/shared
```

### Structure Rationale

- **Module-based organization:** Each domain feature is self-contained with routes, controller, service, and validator. This matches existing architecture and scales well for microservices extraction if needed.
- **Shared components package:** Admin and client apps share `CategoryTree`, `AttributeDisplay`, and other presentational components. These live in `apps/client/src/components/shared` and are imported by admin (since client has more UI components). Alternatively, create `packages/ui` for truly shared components.
- **Event-driven boundaries:** Services don't directly call each other. Instead, they emit events (`order.created`, `inventory.updated`) that other services subscribe to, preventing tight coupling.
- **Business logic in services:** Controllers are thin request handlers. All domain logic lives in service classes, making business rules testable without HTTP concerns.

## Architectural Patterns

### Pattern 1: Materialized Path for Category Trees

**What:** Store category hierarchy as a path string (e.g., `/electronics/computers/laptops`) in each category record. Each category has `id`, `name`, `parent_id`, and `path`.

**When to use:** Infinite-depth category trees with a good balance of reads and writes. Best for e-commerce where category browsing (reads) is frequent but category reorganization (writes) is occasional.

**Trade-offs:**
- **Pros:** Fast ancestor and descendant queries with simple `LIKE` operations, no recursive CTEs needed, easy breadcrumb generation, simple to understand and maintain.
- **Cons:** Path updates when moving subtrees require updating all descendants' paths, max path length limitation (PostgreSQL text is fine, but plan for ~1000 chars max).

**Example:**
```typescript
// Category model (Prisma schema)
model Category {
  id        String    @id @default(uuid())
  name      String
  slug      String    @unique
  parent_id String?
  path      String    // e.g., "/electronics/computers/laptops"

  parent    Category?  @relation("CategoryTree", fields: [parent_id], references: [id])
  children  Category[] @relation("CategoryTree")
}

// Service method: Get all descendants
async getDescendants(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  return prisma.category.findMany({
    where: { path: { startsWith: category.path + "/" } }
  });
}

// Service method: Move category (update all descendant paths)
async moveCategory(categoryId: string, newParentId: string | null) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  const newParent = newParentId
    ? await prisma.category.findUnique({ where: { id: newParentId } })
    : null;

  const oldPath = category.path;
  const newPath = newParent ? `${newParent.path}/${category.slug}` : `/${category.slug}`;

  // Update category and all descendants in transaction
  await prisma.$transaction([
    prisma.category.update({
      where: { id: categoryId },
      data: { parent_id: newParentId, path: newPath }
    }),
    prisma.category.updateMany({
      where: { path: { startsWith: `${oldPath}/` } },
      data: { path: { replace: { from: oldPath, to: newPath } } } // Replace prefix
    })
  ]);
}
```

### Pattern 2: JSONB for Dynamic Product Attributes

**What:** Store product-specific attributes (color, size, material, CPU, RAM, etc.) as a JSONB column instead of EAV or separate tables. Core product fields (name, price, SKU) remain as typed columns.

**When to use:** Products with highly variable attributes across categories (T-shirt has color/size, laptop has CPU/RAM/storage). When attribute schema changes frequently without database migrations.

**Trade-offs:**
- **Pros:** 1000x better performance than EAV, supports GIN indexing for fast attribute filtering, 3x smaller database size, simple queries without joins, schema flexibility without migrations.
- **Cons:** Entire JSONB column must be updated for any change (row-level lock contention in high-write scenarios), no foreign key constraints on JSONB values, requires expression indexes for specific attribute paths.

**Example:**
```typescript
// Product model (Prisma schema)
model Product {
  id          String   @id @default(uuid())
  name        String
  sku         String   @unique
  price       Decimal
  category_id String
  attributes  Json     // JSONB: { "color": "blue", "size": "M", "material": "cotton" }

  category    Category @relation(fields: [category_id], references: [id])
}

// Service method: Filter products by attributes
async filterProducts(categoryId: string, filters: Record<string, any>) {
  const whereConditions = Object.entries(filters).map(([key, value]) => ({
    attributes: {
      path: [key],
      equals: value
    }
  }));

  return prisma.product.findMany({
    where: {
      category_id: categoryId,
      AND: whereConditions
    }
  });
}

// SQL equivalent (for creating indexes):
// CREATE INDEX idx_product_attributes_color ON products USING GIN ((attributes -> 'color'));
// CREATE INDEX idx_product_attributes_size ON products USING GIN ((attributes -> 'size'));
```

**Hybrid model recommendation:** Core entity fields (name, price, SKU, category_id) as typed columns + JSONB for flexible attributes. This balances type safety with flexibility.

### Pattern 3: Product Variant with Option Combinations

**What:** Represent product variants as separate entities linked to a parent product. Each variant stores option combinations (e.g., Size=L, Color=Red), has its own SKU, price override, and inventory.

**When to use:** Products with multiple options (color, size, material) that create independent SKUs. Required when each combination has different pricing or inventory.

**Trade-offs:**
- **Pros:** Each variant is independently trackable for inventory and sales, supports price overrides per variant, clean separation between product and variant data.
- **Cons:** Combinatorial explosion (5 colors × 10 sizes = 50 variants), requires careful SKU generation strategy, admin UI complexity for managing variants.

**Example:**
```typescript
// Prisma schema
model ProductOption {
  id         String   @id @default(uuid())
  product_id String
  name       String   // e.g., "Color"
  values     String[] // e.g., ["Red", "Blue", "Green"]

  product    Product  @relation(fields: [product_id], references: [id])
}

model ProductVariant {
  id              String  @id @default(uuid())
  product_id      String
  sku             String  @unique
  options         Json    // { "color": "Red", "size": "L" }
  price_override  Decimal?
  inventory_qty   Int     @default(0)

  product         Product @relation(fields: [product_id], references: [id])
}

// Service: Generate SKU from options
generateSKU(productSKU: string, options: Record<string, string>): string {
  // Format: PRODUCT-COLOR_ABBREV-SIZE_ABBREV
  // Example: TSH001-RED-L
  const optionCodes = Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b)) // Consistent ordering
    .map(([key, value]) => this.abbreviate(value))
    .join('-');

  return `${productSKU}-${optionCodes}`;
}

// Service: Create all variant combinations
async generateVariants(productId: string, options: ProductOption[]) {
  const combinations = this.cartesianProduct(options.map(o => o.values));

  for (const combo of combinations) {
    const optionsObj = options.reduce((acc, opt, i) => {
      acc[opt.name] = combo[i];
      return acc;
    }, {});

    const sku = this.generateSKU(product.sku, optionsObj);

    await prisma.productVariant.create({
      data: {
        product_id: productId,
        sku,
        options: optionsObj,
        inventory_qty: 0
      }
    });
  }
}
```

### Pattern 4: Atomic Stock Reservation with Race Condition Prevention

**What:** When customer adds to cart, create a temporary reservation that atomically decrements `available_quantity` and increments `reserved_quantity`. Use database-level atomic operations to prevent overselling.

**When to use:** Multi-warehouse inventory where multiple customers can attempt to reserve the same item simultaneously.

**Trade-offs:**
- **Pros:** Prevents overselling through database atomicity, reservations expire automatically, supports multi-warehouse allocation logic.
- **Cons:** Requires cleanup job for expired reservations, adds complexity to inventory queries, potential for reservation "leakage" if cleanup fails.

**Example:**
```typescript
// Prisma schema
model InventoryLocation {
  id                String  @id @default(uuid())
  warehouse_id      String
  product_variant_id String
  total_quantity    Int
  available_quantity Int
  reserved_quantity Int     @default(0)

  warehouse         Warehouse      @relation(fields: [warehouse_id], references: [id])
  variant           ProductVariant @relation(fields: [product_variant_id], references: [id])
  reservations      StockReservation[]
}

model StockReservation {
  id              String   @id @default(uuid())
  inventory_id    String
  cart_id         String
  quantity        Int
  expires_at      DateTime
  status          String   // 'active', 'completed', 'expired'

  inventory       InventoryLocation @relation(fields: [inventory_id], references: [id])
}

// Service: Reserve stock atomically
async reserveStock(variantId: string, quantity: number, cartId: string): Promise<boolean> {
  // Find warehouse with available stock (FIFO or priority-based)
  const location = await prisma.inventoryLocation.findFirst({
    where: {
      product_variant_id: variantId,
      available_quantity: { gte: quantity }
    },
    orderBy: { warehouse_id: 'asc' } // Warehouse priority
  });

  if (!location) return false;

  // Atomic update: decrement available, increment reserved
  const updated = await prisma.inventoryLocation.updateMany({
    where: {
      id: location.id,
      available_quantity: { gte: quantity } // Re-check in WHERE to prevent race
    },
    data: {
      available_quantity: { decrement: quantity },
      reserved_quantity: { increment: quantity }
    }
  });

  if (updated.count === 0) return false; // Another request won the race

  // Create reservation record
  await prisma.stockReservation.create({
    data: {
      inventory_id: location.id,
      cart_id: cartId,
      quantity,
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      status: 'active'
    }
  });

  eventBus.emit('inventory.reserved', { variantId, quantity, cartId });
  return true;
}

// Background job: Release expired reservations
async releaseExpiredReservations() {
  const expired = await prisma.stockReservation.findMany({
    where: {
      expires_at: { lt: new Date() },
      status: 'active'
    },
    include: { inventory: true }
  });

  for (const reservation of expired) {
    await prisma.$transaction([
      prisma.inventoryLocation.update({
        where: { id: reservation.inventory_id },
        data: {
          available_quantity: { increment: reservation.quantity },
          reserved_quantity: { decrement: reservation.quantity }
        }
      }),
      prisma.stockReservation.update({
        where: { id: reservation.id },
        data: { status: 'expired' }
      })
    ]);

    eventBus.emit('inventory.reservation_expired', {
      reservationId: reservation.id,
      cartId: reservation.cart_id
    });
  }
}
```

### Pattern 5: Rule-Based Promotion Engine

**What:** Store promotion rules as data (not code) with conditions (triggers) and actions (discounts). Evaluation engine processes cart against active rules and calculates applicable discounts.

**When to use:** Supporting coupons, BOGO, percentage/fixed discounts, cart-level and item-level promotions without code changes.

**Trade-offs:**
- **Pros:** Business users can create promotions without developer involvement, rules are testable and auditable, supports complex stacking and exclusivity rules.
- **Cons:** Rule engine adds computational overhead, complex rule combinations can be hard to reason about, requires careful conflict resolution.

**Example:**
```typescript
// Prisma schema
model Promotion {
  id                String   @id @default(uuid())
  code              String?  @unique // null for automatic promotions
  name              String
  type              String   // 'percentage', 'fixed', 'bogo', 'free_shipping'
  value             Decimal  // percentage (0.2 = 20%) or fixed amount
  conditions        Json     // { "min_cart_total": 50, "product_ids": [...] }
  targets           Json     // { "applies_to": "cart" | "products", "product_ids": [...] }
  start_date        DateTime
  end_date          DateTime
  max_uses          Int?
  max_uses_per_user Int?
  stackable         Boolean  @default(false)
  priority          Int      @default(0)

  uses              PromotionUse[]
}

model PromotionUse {
  id           String   @id @default(uuid())
  promotion_id String
  user_id      String?
  order_id     String
  discount_amount Decimal
  created_at   DateTime @default(now())

  promotion    Promotion @relation(fields: [promotion_id], references: [id])
}

// Service: Evaluate promotions for cart
async evaluatePromotions(cart: Cart, couponCode?: string): Promise<Discount[]> {
  const now = new Date();

  // Fetch active promotions
  const promotions = await prisma.promotion.findMany({
    where: {
      OR: [
        { code: null }, // Automatic promotions
        { code: couponCode } // User-entered coupon
      ],
      start_date: { lte: now },
      end_date: { gte: now }
    },
    orderBy: { priority: 'desc' } // Higher priority first
  });

  const applicableDiscounts: Discount[] = [];

  for (const promo of promotions) {
    // Check conditions
    if (!this.checkConditions(cart, promo.conditions)) continue;

    // Check usage limits
    if (promo.max_uses) {
      const usageCount = await prisma.promotionUse.count({
        where: { promotion_id: promo.id }
      });
      if (usageCount >= promo.max_uses) continue;
    }

    // Calculate discount
    const discount = this.calculateDiscount(cart, promo);
    applicableDiscounts.push(discount);

    // Stop if not stackable
    if (!promo.stackable) break;
  }

  return applicableDiscounts;
}

private checkConditions(cart: Cart, conditions: any): boolean {
  if (conditions.min_cart_total && cart.subtotal < conditions.min_cart_total) {
    return false;
  }

  if (conditions.product_ids && conditions.product_ids.length > 0) {
    const hasProduct = cart.items.some(item =>
      conditions.product_ids.includes(item.product_id)
    );
    if (!hasProduct) return false;
  }

  // Add more condition checks as needed
  return true;
}

private calculateDiscount(cart: Cart, promo: Promotion): Discount {
  if (promo.type === 'percentage') {
    return {
      promotion_id: promo.id,
      amount: cart.subtotal * parseFloat(promo.value.toString()),
      description: `${promo.name} (${promo.value * 100}% off)`
    };
  } else if (promo.type === 'fixed') {
    return {
      promotion_id: promo.id,
      amount: parseFloat(promo.value.toString()),
      description: `${promo.name} ($${promo.value} off)`
    };
  }
  // Add BOGO, free shipping, etc.
}
```

## Data Flow

### Product Display Flow (Client App)

```
User visits /products/laptop-xyz
    ↓
Next.js SSR fetches product data
    ↓
API: GET /api/products/laptop-xyz
    ↓
ProductController.getById()
    ↓
ProductService.findById(id) → Prisma query
    ↓
PostgreSQL: SELECT * FROM products WHERE id = ? (includes JSONB attributes)
    ↓
Response: { id, name, price, attributes: { cpu: "i7", ram: "16GB" }, variants: [...] }
    ↓
Next.js renders ProductPage with variant selector
    ↓
User selects variant (Size=L, Color=Blue)
    ↓
Client-side: Filter variants by selected options
    ↓
Display: Price, SKU, inventory status for selected variant
```

### Checkout with Stock Reservation Flow

```
User clicks "Checkout"
    ↓
Client: POST /api/orders/reserve-stock
    ↓
OrderController.reserveStock()
    ↓
InventoryService.reserveStock(variantId, quantity, cartId)
    ↓
PostgreSQL: Atomic UPDATE inventory SET available_qty = available_qty - X, reserved_qty = reserved_qty + X
    ↓
PostgreSQL: INSERT INTO stock_reservations (expires_at = NOW() + 15 minutes)
    ↓
EventBus.emit('inventory.reserved', { variantId, quantity })
    ↓
Response: { success: true, reservation_id }
    ↓
User proceeds to payment
    ↓
Client: POST /api/payments/create-intent
    ↓
PaymentController.createIntent()
    ↓
PaymentService.createStripeIntent(amount, metadata: { reservation_id })
    ↓
Stripe API: Create PaymentIntent
    ↓
Response: { client_secret }
    ↓
User completes payment
    ↓
Stripe Webhook: POST /api/payments/webhook (payment_intent.succeeded)
    ↓
PaymentController.handleWebhook()
    ↓
OrderService.createOrder(paymentIntent)
    ↓
MongoDB: Insert order document
    ↓
EventBus.emit('order.created', { orderId, items })
    ↓
InventoryService (listener): Convert reservation to fulfilled
    ↓
PostgreSQL: UPDATE stock_reservations SET status = 'completed'
PostgreSQL: UPDATE inventory SET reserved_qty = reserved_qty - X (stock already deducted)
```

### Admin Product Creation with Variants Flow

```
Admin creates product with options (Color, Size)
    ↓
Admin UI: ProductForm with OptionBuilder component
    ↓
Admin selects: Colors = [Red, Blue], Sizes = [S, M, L]
    ↓
Client: POST /api/admin/products
    ↓
ProductController.create()
    ↓
ProductService.createWithVariants({ name, price, options: [...] })
    ↓
PostgreSQL: Begin transaction
PostgreSQL: INSERT INTO products (name, sku, price)
PostgreSQL: INSERT INTO product_options (product_id, name, values)
    ↓
ProductService.generateVariants(productId, options)
    ↓
Generate combinations: [Red/S, Red/M, Red/L, Blue/S, Blue/M, Blue/L]
    ↓
For each combination:
  - Generate SKU: PROD001-RED-S
  - PostgreSQL: INSERT INTO product_variants (product_id, sku, options, inventory_qty=0)
    ↓
PostgreSQL: Commit transaction
    ↓
EventBus.emit('product.created', { productId, variantCount: 6 })
    ↓
SearchService (listener): Index product in Algolia
    ↓
Response: { id, name, variants: [...] }
    ↓
Admin UI: Redirect to /products/{id}/inventory (set stock for each variant)
```

### Category Tree Navigation Flow

```
User visits /categories/electronics/computers
    ↓
Next.js SSR: Fetch category and descendants
    ↓
API: GET /api/categories/by-path?path=/electronics/computers
    ↓
CategoryController.getByPath(path)
    ↓
CategoryService.findByPath(path)
    ↓
PostgreSQL: SELECT * FROM categories WHERE path = '/electronics/computers'
    ↓
CategoryService.getChildren(categoryId)
    ↓
PostgreSQL: SELECT * FROM categories WHERE path LIKE '/electronics/computers/%' AND path NOT LIKE '/electronics/computers/%/%'
(Direct children only, not grandchildren)
    ↓
Response: { category, children: [...], breadcrumbs: [...] }
    ↓
Next.js renders: Breadcrumbs + Subcategory grid + Product list
    ↓
User clicks subcategory "Laptops"
    ↓
Navigate to /categories/electronics/computers/laptops (repeat flow)
```

### Promotion Application Flow

```
User adds items to cart
    ↓
Client: POST /api/cart/add-item
    ↓
CartService.addItem(userId, variantId, quantity)
    ↓
PostgreSQL: INSERT INTO cart_items or UPDATE quantity
    ↓
Client: GET /api/cart (fetch updated cart)
    ↓
CartController.getCart()
    ↓
CartService.getCart(userId)
    ↓
PromotionService.evaluatePromotions(cart)
    ↓
PostgreSQL: SELECT * FROM promotions WHERE start_date <= NOW() AND end_date >= NOW()
    ↓
For each promotion:
  - Check conditions (min_cart_total, product_ids, etc.)
  - Calculate discount amount
  - Check stackability
    ↓
Response: { items: [...], subtotal, discounts: [...], total }
    ↓
Client renders: Cart with applied discounts
    ↓
User enters coupon code "SAVE20"
    ↓
Client: POST /api/cart/apply-coupon { code: "SAVE20" }
    ↓
PromotionService.evaluatePromotions(cart, couponCode)
    ↓
PostgreSQL: SELECT * FROM promotions WHERE code = 'SAVE20' AND ...
    ↓
Apply additional discount
    ↓
Response: { items: [...], subtotal, discounts: [...], total }
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-10k users | Current monorepo architecture is perfect. Single server instance with PostgreSQL/MongoDB on separate VMs or managed services. Redis for session caching. Focus on query optimization and proper indexing. |
| 10k-100k users | Horizontal scaling of API server (multiple Express instances behind load balancer). Read replicas for PostgreSQL (product catalog queries). Redis cluster for distributed session/cache. CDN for static assets and product images. Consider separating search to dedicated Algolia/Meilisearch. Background job queue (Bull/BullMQ) for async tasks like email, inventory updates. |
| 100k-1M users | Extract high-traffic services to separate deployments (Product Service, Order Service, Inventory Service as independent apps). Message broker (RabbitMQ/Kafka) replaces in-process event bus. Database sharding for orders (by user_id or date). Separate analytics database (read-only replicas or data warehouse). Consider GraphQL federation or API Gateway (Kong/Tyk) for unified API. |

### Scaling Priorities

1. **First bottleneck:** Database query performance.
   - **Detection:** Slow API responses (>500ms), high database CPU.
   - **Fix:** Add indexes on frequently queried columns (category_id, sku, path for LIKE queries). Use EXPLAIN ANALYZE to identify slow queries. Add Redis caching for product catalog reads. Implement database connection pooling (PgBouncer).

2. **Second bottleneck:** API server concurrency limits.
   - **Detection:** Increased request latency under load, memory pressure, event loop lag in Node.js.
   - **Fix:** Horizontal scaling with multiple Express instances behind Nginx or AWS ALB. Use PM2 cluster mode for multi-core utilization on single server. Implement rate limiting to prevent abuse.

3. **Third bottleneck:** Stock reservation contention.
   - **Detection:** Failed reservations during high-traffic periods (flash sales), deadlocks in inventory table.
   - **Fix:** Partition inventory by warehouse_id. Implement optimistic locking with version fields. Use queue-based reservation processing to serialize high-contention updates. Consider eventual consistency model where reservation is async confirmed.

## Anti-Patterns

### Anti-Pattern 1: EAV for Product Attributes

**What people do:** Create three tables (Entity, Attribute, Value) where each product attribute is stored as a separate row. Example: Product 1 → Attribute "color" → Value "red" (one row), Product 1 → Attribute "size" → Value "M" (another row).

**Why it's wrong:** Performance degrades catastrophically at scale. Filtering products by 3 attributes requires 6+ joins. No type safety (all values are strings). Database bloat (millions of rows for thousands of products). 1000x slower than JSONB for reads. Index maintenance overhead is massive.

**Do this instead:** Use PostgreSQL JSONB columns for dynamic attributes. Core fields (name, price, SKU) as typed columns. JSONB for category-specific attributes. Create GIN indexes on frequently filtered JSONB paths. Achieves same flexibility with 1000x better performance.

### Anti-Pattern 2: Nested Set Model for Categories

**What people do:** Store category hierarchy using left/right boundary numbers. Each category has `lft` and `rgt` integers that define its position in the tree.

**Why it's wrong:** While reads are fast, any insert/delete/move operation requires renumbering potentially thousands of nodes. In e-commerce, category trees change frequently (new categories, reorganization). Concurrent modifications cause race conditions and corrupt tree structure. Debugging and visualization are difficult.

**Do this instead:** Use Materialized Path (store path as string like `/electronics/computers/laptops`). Simpler to understand and maintain. Fast reads with `WHERE path LIKE '/electronics/%'`. Moving nodes only updates descendants' paths. Modern PostgreSQL handles string operations efficiently with proper indexes.

### Anti-Pattern 3: Synchronous Service Calls Without Events

**What people do:** OrderService directly calls `inventoryService.decrementStock()` and `paymentService.charge()` within the order creation function. If payment fails, manually call `inventoryService.incrementStock()` to rollback.

**Why it's wrong:** Tight coupling between services (can't deploy independently). Cascade failures (if inventory service is down, orders fail). Complex rollback logic across service boundaries. Long request times (user waits for all operations). Distributed transaction complexity (2-phase commit).

**Do this instead:** Use event-driven architecture. OrderService emits `order.created` event. InventoryService listens and decrements stock. PaymentService listens and processes payment. If payment fails, emit `payment.failed` event and InventoryService restores stock. Services are decoupled, failures are isolated, operations are async.

### Anti-Pattern 4: Generating All Variant Combinations Upfront

**What people do:** For a product with 10 colors, 8 sizes, and 3 materials, automatically create all 240 combinations (10×8×3) as variants in the database, even if most combinations don't actually exist.

**Why it's wrong:** Database bloat with invalid variants (Red/XS/Leather may not exist). Admin UX nightmare (editing 240 variants). Inventory complexity (tracking stock for non-existent items). Performance overhead (loading 240 variants to display product page).

**Do this instead:** Let admin selectively create only valid variants. Provide UI to bulk-create common combinations but allow manual control. Store option definitions separately from variants. Only create variant record when admin assigns SKU and inventory. This matches reality (not all combinations exist) and keeps database lean.

### Anti-Pattern 5: Storing Cart in Database for Every Item Change

**What people do:** On every "add to cart" action, immediately persist cart to PostgreSQL/MongoDB. User changes quantity → database write. User removes item → database write. 20 interactions = 20 database writes before checkout.

**Why it's wrong:** Unnecessary database load for ephemeral data. Performance bottleneck during high traffic. Cart data has high churn (most carts are abandoned). Wasted storage for guest users who never convert.

**Do this instead:** Use localStorage/sessionStorage for guest carts (client-side only). For authenticated users, debounce cart updates (persist after 2-3 seconds of inactivity, not on every keystroke). Use Redis for cart caching (fast, TTL-based expiration). Only persist cart to database when user proceeds to checkout or after significant inactivity (5+ minutes). This reduces database writes by 90%+ while maintaining user experience.

### Anti-Pattern 6: No Stock Reservation Before Payment

**What people do:** Check inventory availability at cart display time. User proceeds to payment. While payment processes (30-60 seconds), another user buys the last item. First user's payment succeeds but item is now out of stock. Order fails or oversells.

**Why it's wrong:** Race condition causes overselling or failed orders after payment. Poor user experience (charged but no product). Refund overhead and customer service burden. Inventory inaccuracy.

**Do this instead:** Implement atomic stock reservation when user clicks "Checkout". Create reservation record with 15-minute expiration. Payment intent includes reservation_id. If payment succeeds, convert reservation to fulfilled. If payment fails or expires, release reservation. Background job cleans up expired reservations. This guarantees item availability for users in checkout flow.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Clerk (Auth) | Middleware on protected routes, JWT verification | Use `@clerk/clerk-sdk-node`. Validate tokens in `auth.middleware.ts`. Store Clerk `user_id` in database for orders/profiles. Webhook for user sync. |
| Stripe (Payments) | Server-side SDK for PaymentIntent creation, webhook endpoint for events | Use `stripe` npm package. Never expose secret key to frontend. Implement idempotency keys for payment operations. Verify webhook signatures. |
| Algolia/Meilisearch (Search) | Index on product CRUD events, proxy search requests from client | Listen to `product.created`, `product.updated`, `product.deleted` events. Batch index updates for performance. Admin can trigger manual re-index. |
| Cloudinary (Media) | Direct upload from admin UI, signed upload URLs | Use signed upload preset for security. Store Cloudinary URLs in product `images` JSONB field. Implement image transformations for thumbnails/responsive sizes. |
| Resend (Email) | Event-driven email triggers, transactional templates | Listen to `order.created`, `order.shipped`, `payment.failed` events. Use templates for consistent branding. Implement retry logic for failed sends. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Product ↔ Inventory | Events (`product.created`, `product.deleted`) | Inventory service initializes stock entries when product/variant is created. Deletes inventory when product is removed. No direct calls. |
| Order ↔ Payment | Events (`order.pending_payment`, `payment.completed`, `payment.failed`) | Order service creates order in "pending" status, emits event. Payment service processes, emits result. Order service updates status based on payment events. |
| Order ↔ Inventory | Events (`order.created`, `order.cancelled`) | Order service emits event with line items. Inventory service converts reservations to fulfilled or releases stock on cancellation. |
| Client ↔ Admin | Shared component package (`packages/ui` or `apps/client/src/components/shared`) | Shared presentational components (CategoryTree, AttributeDisplay). No shared business logic (different permissions). Shared API client types from `@repo/types`. |
| All Services ↔ Event Bus | In-process EventEmitter (current), Message Broker (at scale) | Current: Typed EventEmitter in same Node process. At scale (100k+ users): Replace with RabbitMQ/Kafka for cross-service communication. Event schema versioning important. |

## Build Order and Dependencies

To minimize rework and ensure components are built in logical order, follow this dependency-based sequence:

### Phase 1: Foundation (No external dependencies)
1. **Database schema expansion** - Category, ProductOption, ProductVariant, InventoryLocation, Promotion models
2. **Event bus typing** - Strongly-typed event definitions for all domain events
3. **Shared types package** - Add new types for categories, variants, inventory, promotions

### Phase 2: Core Domain Services (Depends on Phase 1)
4. **Category service** - Materialized path CRUD, tree traversal, breadcrumb generation
5. **Product variant service** - Option combinations, SKU generation, variant creation
6. **Inventory service** - Multi-warehouse stock tracking (no reservation yet)

### Phase 3: Advanced Features (Depends on Phase 2)
7. **Dynamic attribute system** - JSONB attribute storage, filtering logic, expression indexes
8. **Stock reservation system** - Atomic reservation, expiration cleanup, event integration
9. **Promotion engine** - Rule evaluation, discount calculation, usage tracking

### Phase 4: Integration Services (Depends on Phase 3)
10. **Search integration** - Product indexing on CRUD events, faceted search, autocomplete
11. **Payment integration** - Stripe PaymentIntent, webhook handling, reservation linkage
12. **Auth integration** - Clerk middleware, session management, role-based access

### Phase 5: User Interfaces (Depends on Phase 4)
13. **Client product pages** - Category navigation, variant selection, attribute filters
14. **Client checkout flow** - Stock reservation, payment processing, order confirmation
15. **Admin product management** - Variant builder, attribute manager, inventory allocation
16. **Admin promotion builder** - Rule creation UI, condition/action configuration

**Rationale:** Each phase builds on previous phases without circular dependencies. Database schema must exist before services. Core services before advanced features. Backend complete before frontend consumes it. This order minimizes refactoring and allows incremental testing.

## Sources

- [From Trees to Tables: Storing Hierarchical Data in Relational Databases](https://medium.com/@rishabhdevmanu/from-trees-to-tables-storing-hierarchical-data-in-relational-databases-a5e5e6e1bd64)
- [Storing Hierarchical Data in a Database — SitePoint](https://www.sitepoint.com/hierarchical-data-database/)
- [Materialized Path Category Hierarchy](https://learnmongodbthehardway.com/schema/categoryhierarchy/)
- [PostgreSQL JSONB vs. EAV: Which is Better for Storing Dynamic Data](https://www.razsamuel.com/postgresql-jsonb-vs-eav-dynamic-data/)
- [Replacing EAV with JSONB in PostgreSQL](https://coussej.github.io/2016/01/14/Replacing-EAV-with-JSONB-in-PostgreSQL/)
- [Storing Dynamic Attributes - Sparse Columns, EAV, and JSONB Explained](https://leapcell.io/blog/storing-dynamic-attributes-sparse-columns-eav-and-jsonb-explained)
- [PostgreSQL JSON Tricks You Need to Know in 2026](https://postgresqlhtx.com/postgresql-json-tricks-you-need-to-know-in-2026/)
- [How to create a document schema for product variants and SKUs for your ecommerce search experience](https://www.elastic.co/blog/how-to-create-a-document-schema-for-product-variants-and-skus-for-your-ecommerce-search-experience)
- [Product Variant Modeling Rules for Ecommerce](https://productlasso.com/en/blog/product-variant-modeling-rules)
- [What is a SKU Number? What It Tells You, and Examples (2026)](https://www.shopify.com/blog/what-is-a-sku-number)
- [Design Inventory Management System: Step-by-Step Guide](https://www.systemdesignhandbook.com/guides/design-inventory-management-system/)
- [How a Warehouse Inventory Management System Supports Multi-Warehouse Operations](https://www.quickmovetech.com/how-a-warehouse-inventory-management-system-supports-multi-warehouse-operations/)
- [Building a Flexible Discount Engine](https://medium.com/@sammyasopa/building-a-flexible-discount-engine-b9f4fba3af51)
- [Guidance for Price and Promotion Engine on AWS](https://aws.amazon.com/solutions/guidance/price-and-promotion-engine-on-aws/)
- [How We Developed Scalable Coupon Management System In Node](https://medium.com/@STYLABSHQ/how-we-developed-scalable-coupon-management-system-in-node-945426b02df1)
- [Monorepo with Turborepo: Enterprise Code Management Guide 2026](https://www.askantech.com/monorepo-with-turborepo-enterprise-code-management-guide-2026/)
- [Frontend Monorepos: A Comprehensive Guide](https://dev.to/tecvanfe/frontend-monorepos-a-comprehensive-guide-2d31)
- [Ecommerce Microservices Architecture: A Complete Guide for Modern Digital Commerce](https://medium.com/@gravityinnovations123/ecommerce-microservices-architecture-a-complete-guide-for-modern-digital-commerce-3137acd5cd14)
- [Microservices-Based Architecture in Ecommerce for Modular Solutions](https://www.scnsoft.com/ecommerce/microservices)
- [Event-Driven Architecture (EDA): A Complete Introduction](https://www.confluent.io/learn/event-driven-architecture/)
- [Event-Driven Architecture in Retail: Real-Time Inventory Synchronization](https://www.researchgate.net/publication/394001365_Event-Driven_Architecture_in_Retail_Real-Time_Inventory_Synchronization_for_Omnichannel_Retail)
- [PostgreSQL Tutorial (2026): From First Query to Production-Grade Patterns](https://thelinuxcode.com/postgresql-tutorial-2026-from-first-query-to-production-grade-patterns/)
- [Schema Design Best Practices | PostgreSQL Tutorial](https://www.swiftorial.com/tutorials/databases/postgresql/best_practices/schema_design_best_practices/)
- [Retail Architecture Best Practices Part 1: Building A MongoDB Product Catalog](https://www.mongodb.com/resources/solutions/industries/retail-reference-architecture-part-1-building-flexible-searchable-low-latency-product)
- [Domain Modeling - Cosmic Python](https://www.cosmicpython.com/book/chapter_01_domain_model.html)

---
*Architecture research for: Universal E-Commerce Template*
*Researched: 2026-03-10*
