# Phase 1: Database Schema Design - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

All database schemas are production-ready with proper models, relations, indexes, and seed data so every subsequent phase can build on a solid data foundation. Covers Prisma (PostgreSQL) and Mongoose (MongoDB) schemas, including seed scripts.

</domain>

<decisions>
## Implementation Decisions

### Product Type Modeling
- Single `Product` table with `productType` enum (SIMPLE, VARIABLE, WEIGHTED, DIGITAL, BUNDLED)
- Common fields in Product table (name, description, price, images, SKU, status, etc.)
- Type-specific data in dedicated child tables (DigitalMeta, WeightedMeta, etc.)
- Compromise between flexibility and type safety — shared base + typed extensions

### Variant System
- EAV approach: OptionGroup (Size, Color) → OptionValue (S, M, L, Red, Blue) → ProductVariant
- ProductVariant has independent pricing, stock, SKU
- Flexible — new option types added without migrations
- OptionGroup and OptionValue as separate Prisma models

### Bundle Products
- BundleItem join table linking bundle product to included products (many-to-many)
- Each BundleItem has quantity and optional discount per item
- Referential integrity maintained via foreign keys

### Dynamic Category Attributes
- JSONB column `attributes` on Product for category-specific filterable properties
- GIN index on the JSONB column for efficient querying
- CategoryAttribute model defines which attributes are available for each category (name, type, possible values)
- Category uses materialized path string for tree hierarchy (per requirements)

### PostgreSQL / MongoDB Split
- **PostgreSQL (Prisma):** All catalog, user, shipping, promotion, and reference data
- **MongoDB (Mongoose):** Order and Cart only — document-oriented with nested items
- Cross-DB references use denormalization — copy needed fields (product name, price, user name) into Mongo documents
- Actual prices verified at checkout time

### Cart Model (MongoDB)
- Supports guest (sessionId) and authenticated (userId) users
- Cart items store snapshots: productId + price/name at time of addition
- TTL: 7 days for guest carts (MongoDB TTL index on `expiresAt`)
- Authenticated user carts persist without TTL

### Pricing
- All prices stored as Int in cents (1299 = $12.99) — Stripe-compatible approach
- No floating point — eliminates rounding errors
- Single currency per store (configured in settings, not per-product)
- Applies to: Product.price, ProductVariant.price, Order line items, Cart snapshots

### Discounts & Promotions
- Separate models: Coupon (user-entered codes) and Promotion (automatic rule-based discounts)
- Discount types: percentage, fixed amount, free shipping
- Both have date ranges, usage limits, and conditions

### Seed Data
- Medium scale: ~50 products, 10-15 categories (3 levels deep), 5-10 users, several orders
- Abstract/generic store theme (Product 1, Category A — not domain-specific)
- All product types covered in seeds (simple, variable, weighted, digital, bundled)
- Full Mongo seeds: orders with various statuses (pending, shipped, delivered) + carts with items

### Claude's Discretion
- Exact field names and column types for meta tables (DigitalMeta, WeightedMeta)
- Index strategy beyond GIN on JSONB (which indexes to add for performance)
- Exact CategoryAttribute schema fields (type constraints, validation rules)
- Shipping model details (zones, methods, rates structure)
- Review model structure (rating scale, moderation fields)
- Seed data generation approach (static JSON vs faker-based)
- Mongoose schema validation strictness

</decisions>

<specifics>
## Specific Ideas

- Prices follow Stripe convention: integer cents, never floats
- Category tree uses materialized path (e.g., "/electronics/phones/smartphones")
- Cart snapshots ensure guests see consistent data even if prices change
- Bundle referential integrity via foreign keys, not JSONB arrays

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/db/prisma/schema.prisma`: Existing models (User, Category, Product, ProductVariant) — need significant expansion
- `packages/db/src/mongoose.ts`: Order model exists — needs enrichment (status history, denormalized fields), Cart model to be added
- `packages/db/src/prisma.ts`: Prisma client singleton — already wired
- `packages/db/src/index.ts`: Barrel exports for both clients

### Established Patterns
- Prisma models use `@map("table_name")` for snake_case table names
- IDs use `cuid()` (not UUID) — maintain this
- Timestamps: `createdAt @default(now())`, `updatedAt @updatedAt`
- Mongoose interfaces prefixed with `I` (IOrder, IOrderItem)
- Mongoose singleton pattern: `mongoose.models.X ?? mongoose.model()`

### Integration Points
- `apps/server/src/modules/product/` — already imports from `@repo/db`
- `apps/server/src/modules/order/` — uses Mongoose OrderModel
- `packages/types/src/index.ts` — shared types need updating to match new schema
- `docker-compose.yml` — PostgreSQL 16 + MongoDB 7 already configured

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-database-schema-design*
*Context gathered: 2026-03-10*
