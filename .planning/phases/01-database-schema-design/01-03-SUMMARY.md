---
phase: 01-database-schema-design
plan: 03
subsystem: user-commerce-schema
tags: [prisma, schema, user, inventory, shipping, promotions, postgres]

dependency_graph:
  requires:
    - Core catalog domain models from Plan 01
  provides:
    - User model with SUPER_ADMIN role and profile fields
    - Address model with multi-address support
    - Wishlist/WishlistItem models with notification preferences
    - Review model with rating, moderation, and verified purchase
    - Coupon and Promotion models with flexible discount rules
    - ShippingZone/ShippingMethod models with geographic zones
    - Warehouse/InventoryItem models for multi-warehouse stock tracking
    - StockMovement audit trail for inventory changes
    - Complete referential integrity across entire schema (SCHEMA-12)
  affects:
    - User authentication and profile management
    - Wishlist and review features
    - Checkout and discount calculations
    - Shipping rate calculation
    - Inventory management and stock tracking
    - All order fulfillment workflows

tech_stack:
  added:
    - Prisma 7.4.2 schema with 25+ models
  patterns:
    - Cascade delete for dependent entities
    - Restrict delete for referenced entities with children
    - SetNull for optional references
    - Unique constraints for variant-warehouse inventory
    - JSONB columns for flexible promotion conditions
    - Enum-based type safety for statuses and types

key_files:
  created:
    - packages/db/scripts/verify-cascades.ts
  modified:
    - packages/db/prisma/schema.prisma

decisions:
  - desc: "Add SUPER_ADMIN role to support three-tier admin hierarchy"
    rationale: "Enables separation of store admins from platform super admins with elevated privileges"
    alternatives: ["Two-tier (CUSTOMER/ADMIN)", "Granular permissions system"]

  - desc: "Separate Coupon and Promotion models instead of unified discount model"
    rationale: "Coupons are user-entered codes, Promotions are automatic rule-based. Different UI, validation, and application logic"
    alternatives: ["Single Discount model with type discriminator"]

  - desc: "Store inventory at variant-warehouse level with reserved field"
    rationale: "Enables multi-warehouse fulfillment and reservation during checkout to prevent overselling"
    alternatives: ["Simple variant-level stock", "Warehouse-level only"]

  - desc: "Use JSONB for promotion conditions instead of fixed columns"
    rationale: "Different promotion types need different conditions (BOGO needs buyQuantity/getQuantity, tiered pricing needs price thresholds). JSONB provides flexibility without schema migrations"
    alternatives: ["Separate condition tables per type", "Fixed columns for all possible conditions"]

  - desc: "Fix Prisma 7 datasource configuration (remove url property)"
    rationale: "Prisma 7 moved database URL from schema.prisma to prisma.config.ts and client constructor. Removal required for schema validation"
    alternatives: ["Downgrade to Prisma 6"]

metrics:
  duration_minutes: 2
  completed_at: "2026-03-10T18:32:00Z"
  tasks_completed: 3
  files_created: 1
  files_modified: 1
  tests_added: 1
  commits: 3

requirements:
  - SCHEMA-01
  - SCHEMA-08
  - SCHEMA-09
  - SCHEMA-12
---

# Phase 01 Plan 03: User, Commerce, and Inventory Schema Summary

**Complete Prisma schema with User profiles, Address, Wishlist, Review, Coupon, Promotion, Shipping, Warehouse, and Inventory models**

## Overview

Completed the Prisma schema by adding all remaining e-commerce entities beyond the product catalog. This includes an expanded User model with SUPER_ADMIN role, Address model supporting multiple addresses per user, Wishlist/Review systems, separate Coupon and Promotion models for flexible discounts, geographic shipping zones with multiple rate types, and multi-warehouse inventory tracking with stock movement audit trails.

All models across the entire schema now have proper indexes on foreign keys, explicit referential actions (Cascade/Restrict/SetNull) on all relations, and validation constraints. The schema validation script confirms SCHEMA-12 requirement: no orphaned records are possible with the current cascade configuration.

## Tasks Completed

### Task 1: Add User profile, Address, Wishlist, and Review models
- **Status:** Complete ✓
- **Commit:** 21c232c
- **Files:** packages/db/prisma/schema.prisma

Expanded User model with:
- Updated Role enum to include SUPER_ADMIN (three-tier role system)
- Added profile fields: avatar (URL), phone, isActive, lastLoginAt
- Added relations to Address[], Review[], Wishlist[]
- Added indexes on clerkId and role for query performance

Created Address model:
- Multi-address support per user with firstName, lastName, street, street2, city, state, zipCode, country
- isDefault Boolean flag to mark primary address
- label field for custom naming ("Home", "Work")
- Cascade delete on User deletion (no orphaned addresses)

Created Wishlist and WishlistItem models:
- Wishlist with name, isPublic flag, and items relation
- WishlistItem with unique constraint on [wishlistId, productId]
- Notification preferences: notifyOnPriceDrop, notifyOnRestock
- Cascade deletes: Wishlist → User, WishlistItem → Wishlist and Product

Added ReviewStatus enum: PENDING, APPROVED, REJECTED, FLAGGED

Created Review model:
- rating Int (1-5, application layer validation)
- title and body (optional text content)
- photos String[] array for review images
- isVerifiedPurchase Boolean for purchase verification badge
- status field with ReviewStatus enum for moderation workflow
- helpfulCount Int for review voting
- Unique constraint on [userId, productId] (one review per user per product)
- Composite index on [productId, status] for efficient approved review queries
- Cascade deletes on both User and Product

Added review and wishlistItem relations to Product model.

**Auto-fix applied (Rule 3 - blocking issue):** Fixed Prisma 7 datasource configuration by removing `url = env("DATABASE_URL")` property from datasource block. Prisma 7 requires database URLs to be passed via client constructor instead of schema file.

### Task 2: Add Coupon, Promotion, Shipping, Warehouse, and Inventory models
- **Status:** Complete ✓
- **Commit:** bb38f40
- **Files:** packages/db/prisma/schema.prisma

Added discount and promotion enums:
- DiscountType: PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
- PromotionType: BOGO, TIERED_PRICING, FLASH_SALE, AUTOMATIC_DISCOUNT

Created Coupon model (user-entered codes):
- code String @unique for lookup
- discountType and discountValue fields (percentage or cents)
- Usage controls: usageLimit, usageCount, perCustomerLimit
- Scope controls: applicableProductIds, applicableCategoryIds arrays
- Date range: startsAt, expiresAt
- minOrderAmount and maxDiscountAmount for cart threshold and discount cap
- Composite index on [isActive, startsAt, expiresAt] for active coupon queries

Created Promotion model (automatic rule-based):
- type field with PromotionType enum
- conditions Json field for flexible rule storage (JSONB in PostgreSQL)
- stackable Boolean to control promotion combination
- priority Int for application order (higher = applied first)
- Same scope and date controls as Coupon
- Indexes on [isActive, startsAt, expiresAt] and [type]

Added shipping enums and models:
- ShippingRateType: FLAT_RATE, WEIGHT_BASED, PRICE_BASED
- ShippingZone with countries and states arrays for geographic targeting
- freeShippingThreshold Int? for free shipping rules
- ShippingMethod with flexible rate calculation (flatRate, weightRate, priceThresholds)
- estimatedDaysMin/Max for delivery time display
- position field for custom ordering
- Cascade delete: ShippingMethod → ShippingZone

Added inventory enums and models:
- StockMovementReason: SALE, RETURN, MANUAL_ADJUSTMENT, DAMAGE, RESTOCK, RESERVATION, RESERVATION_RELEASE
- Warehouse with code @unique, address fields, lat/long, priority, isActive
- InventoryItem with unique constraint on [variantId, warehouseId]
- quantity and reserved fields (reserved holds stock during checkout)
- lowStockThreshold for reorder alerts
- Cascade deletes: InventoryItem → Warehouse and ProductVariant
- StockMovement with quantity (positive/negative), reason, reference, note
- Indexes on inventoryItemId and createdAt for audit queries
- Cascade delete: StockMovement → InventoryItem

Added inventoryItems relation to ProductVariant model.

All models have proper indexes on foreign keys and explicit onDelete actions.

### Task 3: Verify cascading delete behavior for SCHEMA-12
- **Status:** Complete ✓
- **Commit:** cb61612
- **Files:** packages/db/scripts/verify-cascades.ts

Created TypeScript verification script to validate referential integrity across entire schema:
- Tests 26 parent-child relationships
- Verifies Cascade deletes for dependent entities (Address, Review, Wishlist, ProductVariant, InventoryItem, StockMovement, etc.)
- Verifies Restrict deletes for Category → parent Category and Product → Category
- Verifies SetNull for Brand → Product (optional reference)
- All 26 checks passed

**Verification results:**
- ✓ 26/26 cascade/restrict/setNull actions confirmed
- ✓ SCHEMA-12 requirement satisfied: No orphaned records possible with current configuration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma 7 datasource configuration error**
- **Found during:** Task 1
- **Issue:** Prisma CLI 7.4.2 validation failed with error P1012: "The datasource property `url` is no longer supported in schema files"
- **Fix:** Removed `url = env("DATABASE_URL")` line from datasource block in schema.prisma
- **Rationale:** Prisma 7 moved database URL configuration from schema to prisma.config.ts and client constructor. This is a breaking change from Prisma 6. Schema validation required the fix before proceeding.
- **Files modified:** packages/db/prisma/schema.prisma (datasource block)
- **Commit:** 21c232c (part of Task 1 commit)

No other deviations. Plan executed as specified.

## Verification Results

All automated verification passed:

**Task 1 verification:**
- ✓ `npx prisma validate` passes
- ✓ Role enum has CUSTOMER, ADMIN, SUPER_ADMIN
- ✓ User model has avatar, phone, isActive, lastLoginAt fields
- ✓ User has relations to Address[], Review[], Wishlist[]
- ✓ Address model has isDefault Boolean, userId foreign key with Cascade delete
- ✓ Wishlist/WishlistItem models exist with unique [wishlistId, productId]
- ✓ ReviewStatus enum exists with PENDING, APPROVED, REJECTED, FLAGGED
- ✓ Review has rating Int, isVerifiedPurchase, status fields
- ✓ Review has unique [userId, productId] constraint
- ✓ Product has reviews and wishlistItems relations

**Task 2 verification:**
- ✓ `npx prisma validate` passes
- ✓ DiscountType enum has PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
- ✓ PromotionType enum has BOGO, TIERED_PRICING, FLASH_SALE, AUTOMATIC_DISCOUNT
- ✓ Coupon model has code @unique, discountType, usageLimit, startsAt/expiresAt
- ✓ Promotion model has type, conditions Json, stackable, priority fields
- ✓ ShippingRateType enum has FLAT_RATE, WEIGHT_BASED, PRICE_BASED
- ✓ ShippingZone has countries array, freeShippingThreshold
- ✓ ShippingMethod has zoneId, rateType, flatRate/weightRate/priceThresholds
- ✓ Warehouse has code @unique, latitude/longitude, priority
- ✓ InventoryItem has unique [variantId, warehouseId], quantity, reserved fields
- ✓ StockMovement has inventoryItemId, quantity, reason, createdAt
- ✓ ProductVariant has inventoryItems relation

**Task 3 verification:**
- ✓ `npx tsx packages/db/scripts/verify-cascades.ts` passes with 26/26 checks
- ✓ All Cascade deletes verified (dependent entities)
- ✓ All Restrict deletes verified (categories with products/children)
- ✓ All SetNull deletes verified (optional brand references)
- ✓ SCHEMA-12 requirement satisfied

## Success Criteria Met

- [x] Complete Prisma schema validates without errors
- [x] User model has 3 roles including SUPER_ADMIN
- [x] All commerce entities defined (Address, Wishlist, Review, Coupon, Promotion, Shipping, Warehouse, Inventory)
- [x] All foreign keys indexed
- [x] All relations have explicit referential actions
- [x] All prices stored as Int (cents)
- [x] All IDs use cuid()
- [x] All tables use @@map with snake_case
- [x] SCHEMA-12 verified: No orphaned records possible

## Key Artifacts

**packages/db/prisma/schema.prisma** (523 lines)
- 25+ models total
- 11 enums (including Role, ProductType, ProductStatus, WeightUnit, AttributeType, ReviewStatus, DiscountType, PromotionType, ShippingRateType, StockMovementReason)
- User domain: User, Address (3 models with wishlists below)
- Wishlist domain: Wishlist, WishlistItem
- Review domain: Review
- Discount domain: Coupon, Promotion
- Shipping domain: ShippingZone, ShippingMethod
- Inventory domain: Warehouse, InventoryItem, StockMovement
- Complete catalog domain from Plan 01 (Product, Category, Brand, Tag, Collection, variants, options)
- All indexes and constraints defined
- All onDelete actions explicit (Cascade/Restrict/SetNull)

**packages/db/scripts/verify-cascades.ts** (63 lines)
- Reads schema.prisma and validates 26 parent-child relationships
- Tests Cascade, Restrict, and SetNull patterns
- Exits with code 1 if any check fails
- Used for SCHEMA-12 verification

## Next Steps

**Immediate next plan:**
- Plan 01-04: Add Order and Cart Mongoose schemas (MongoDB)
- Cross-database references with denormalized data
- Order status workflow and payment integration fields
- Cart TTL for guest users

**Dependencies for other phases:**
- Phase 03 (User & Auth): User/Address models ready for Clerk integration
- Phase 05 (Checkout): Coupon/Promotion models ready for discount calculations
- Phase 06 (Shipping): ShippingZone/ShippingMethod ready for rate calculation
- Phase 10 (Inventory): Warehouse/InventoryItem/StockMovement ready for stock tracking
- Phase 11 (Reviews): Review model ready for moderation workflows

## Dependencies

**Required:**
- Plan 01-01 (Product Catalog Schema): Product, ProductVariant, Category models

**Provided for:**
- Phase 03: User authentication and profile management
- Phase 04: Wishlist API endpoints
- Phase 05: Checkout and discount logic
- Phase 06: Shipping rate calculation
- Phase 08: Review moderation admin panel
- Phase 10: Inventory management and stock tracking
- Phase 11: Customer review submissions
- All phases requiring user context, shipping, or inventory

## Technical Notes

**User Role Hierarchy:**
- CUSTOMER: Standard users with shopping access
- ADMIN: Store administrators with catalog/order management
- SUPER_ADMIN: Platform administrators with elevated system access

**Multi-Warehouse Inventory:**
- InventoryItem stores quantity and reserved per variant-warehouse pair
- reserved field holds stock during checkout to prevent overselling
- Warehouse priority determines allocation order for fulfillment
- StockMovement provides complete audit trail of all quantity changes

**Promotion Flexibility:**
- conditions JSONB field enables custom rules per promotion type
- BOGO: `{buyQuantity: 2, getQuantity: 1}`
- Tiered pricing: `{tiers: [{minQuantity: 5, discount: 10}, {minQuantity: 10, discount: 20}]}`
- Flash sale: `{originalPrice: 5999, flashPrice: 3999}`
- Automatic discount: `{minCartAmount: 10000, discount: 1000}`

**Shipping Rate Calculation:**
- FLAT_RATE: Fixed cost per zone (e.g., $9.99 for Continental US)
- WEIGHT_BASED: Cost per kg with min/max weight thresholds
- PRICE_BASED: Tiered rates based on cart total (stored in priceThresholds JSONB)

**Review Moderation Workflow:**
- All reviews start as PENDING
- Admins approve → APPROVED (visible on product pages)
- Admins reject → REJECTED (hidden)
- Users/admins flag → FLAGGED (requires review)
- Composite index on [productId, status] optimizes approved review queries

## Self-Check

### Created Files
```bash
FOUND: /Users/muhemmedibrahimov/work/ecom-template/packages/db/scripts/verify-cascades.ts
```

### Modified Files
```bash
FOUND: /Users/muhemmedibrahimov/work/ecom-template/packages/db/prisma/schema.prisma
```

### Commits
```bash
FOUND: 21c232c (Task 1: User, Address, Wishlist, Review models)
FOUND: bb38f40 (Task 2: Coupon, Promotion, Shipping, Warehouse, Inventory models)
FOUND: cb61612 (Task 3: Cascade verification script)
```

## Self-Check: PASSED

All claimed files exist and commits are in git history.
