---
phase: 01-database-schema-design
plan: 02
subsystem: database-mongodb
tags: [mongoose, schema, order, cart, ttl-index, dual-database]
dependency_graph:
  requires:
    - packages/db/src/mongoose.ts (basic Order model)
  provides:
    - OrderModel (enriched with full lifecycle)
    - CartModel (guest + authenticated support)
    - IOrder, IOrderItem, IOrderAddress, IShippingInfo, IPaymentInfo, IOrderStatusChange
    - ICart, ICartItem
  affects:
    - Future order management endpoints
    - Shopping cart APIs
    - Guest checkout flows
tech_stack:
  added:
    - Mongoose TTL indexes for cart expiration
    - Pre-validate hooks for data integrity
  patterns:
    - Denormalized cross-DB references (productId stored as string)
    - Status history tracking with embedded documents
    - Guest vs authenticated user discrimination via userId/sessionId
    - Monetary values as integers (cents)
key_files:
  created:
    - packages/db/src/mongoose.ts (rewritten)
    - packages/db/src/index.ts (barrel exports)
  modified:
    - package.json (added tsx dev dependency)
    - pnpm-lock.yaml (lockfile update)
decisions:
  - "Store all monetary values as integers (cents) to avoid floating-point precision issues"
  - "Use TTL index with expireAfterSeconds: 0 on expiresAt field for automatic guest cart cleanup"
  - "Enforce cart ownership via pre-validate hook (must have userId OR sessionId)"
  - "Use sparse indexes on userId/sessionId to allow null values without index bloat"
  - "Denormalize product data in cart items (name, price, imageUrl, sku) to preserve snapshots at add-to-cart time"
metrics:
  duration_seconds: 157
  tasks_completed: 2
  files_created: 2
  files_modified: 3
  commits: 2
  completed_at: "2026-03-10"
---

# Phase 01 Plan 02: Order and Cart Mongoose Schemas Summary

**One-liner:** Enriched Order model with full lifecycle tracking (statusHistory, payment, shipping sub-documents) and new Cart model supporting guest/authenticated users with TTL-based expiration.

## Tasks Completed

| Task | Name                                                    | Commit  | Status |
| ---- | ------------------------------------------------------- | ------- | ------ |
| 1    | Enrich Order schema and create Cart schema with TTL    | fbc96c7 | Done   |
| 2    | Update barrel exports in index.ts                       | 296a2aa | Done   |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed duplicate index warnings**
- **Found during:** Task 1 verification
- **Issue:** Mongoose warned about duplicate indexes on orderNumber, status, userId (field-level + schema-level), and Cart userId/sessionId (field-level sparse: true + schema-level sparse index)
- **Fix:** Removed field-level `index: true` declarations and kept only schema-level index definitions using `schema.index()`. Removed duplicate `OrderSchema.index({ orderNumber: 1 })` since `unique: true` already creates the index.
- **Files modified:** packages/db/src/mongoose.ts
- **Commit:** fbc96c7 (included in Task 1 commit)

**2. [Rule 3 - Blocking Issue] Installed tsx for verification**
- **Found during:** Task 1 verification
- **Issue:** Plan verification commands used `npx tsx --eval` but tsx was not installed, preventing automated verification
- **Fix:** Added tsx as dev dependency at workspace root with `pnpm add -D tsx -w`
- **Files modified:** package.json, pnpm-lock.yaml
- **Commit:** fbc96c7 (included in Task 1 commit)

## Implementation Details

### Order Model Enhancements

**Interfaces added:**
- `IOrderItem`: productId, variantId (optional), name, sku, price (cents), quantity, imageUrl, attributes (Record<string, string>)
- `IShippingInfo`: method, carrier, trackingNumber, estimatedDelivery, shippedAt, deliveredAt, cost (cents)
- `IPaymentInfo`: provider (default "stripe"), paymentIntentId, status enum, amount (cents), refundedAmount, paidAt
- `IOrderAddress`: firstName, lastName, street, city, state, zipCode, country, phone (optional)
- `IOrderStatusChange`: from, to, changedAt (default now), changedBy, note
- `IOrder`: orderNumber (unique), userId, guestEmail, items, status (8 values: pending/paid/processing/shipped/delivered/cancelled/returned/refund_requested), statusHistory, subtotal, taxAmount, shippingCost, discountAmount, totalAmount, shippingAddress, billingAddress, shipping, payment, couponCode, notes

**Indexes:**
- userId (single)
- orderNumber (unique, via unique: true)
- status (single)
- createdAt (descending)
- Compound: [userId, status]
- Compound: [userId, createdAt]

**Pattern:** All monetary fields stored as Number (cents). Status history tracks every state change with timestamp and optional actor/note.

### Cart Model

**Interfaces added:**
- `ICartItem`: productId, variantId (optional), name, price (cents), quantity (min: 1), imageUrl, sku, attributes (Record<string, string>)
- `ICart`: userId (optional), sessionId (optional), items (default []), couponCode, expiresAt

**Indexes:**
- userId (sparse) — only indexes documents with userId
- sessionId (sparse) — only indexes documents with sessionId
- expiresAt (TTL with expireAfterSeconds: 0) — MongoDB auto-deletes expired documents

**Pre-validate hook:** Throws error if both userId and sessionId are null/undefined, enforcing that every cart must belong to either a guest (sessionId) or authenticated user (userId).

**Pattern:** Guest carts set expiresAt to 7 days from creation. Authenticated user carts leave expiresAt as null (persist indefinitely). Cart items store product snapshots (name, price, imageUrl, sku) at time of addition to preserve pricing even if product changes later.

### Barrel Exports

Updated `packages/db/src/index.ts` to export:
- **Values:** OrderModel, CartModel, connectMongoDB, mongoose
- **Types:** IOrder, IOrderItem, IOrderAddress, IShippingInfo, IPaymentInfo, IOrderStatusChange, ICart, ICartItem

Existing Prisma exports remain unchanged.

## Verification Results

All verification criteria passed:

1. OrderModel.schema.paths includes 21 fields (orderNumber, userId, guestEmail, items, status, statusHistory, subtotal, taxAmount, shippingCost, discountAmount, totalAmount, shippingAddress, billingAddress, shipping, payment, couponCode, notes, _id, createdAt, updatedAt, __v)
2. CartModel.schema.paths includes 9 fields (userId, sessionId, items, couponCode, expiresAt, _id, createdAt, updatedAt, __v)
3. Cart TTL index exists on expiresAt with expireAfterSeconds: 0 (verified via schema.index() call)
4. Order status enum includes all 8 values: pending, paid, processing, shipped, delivered, cancelled, returned, refund_requested
5. All interfaces exported from barrel index.ts (verified via import test)
6. Singleton pattern used for both models: `mongoose.models.X ?? mongoose.model()`

No warnings or errors in final verification run.

## Success Criteria Met

- [x] Order model has full lifecycle fields (statusHistory, payment, shipping sub-documents)
- [x] Cart model supports guest (sessionId) and authenticated (userId) users
- [x] TTL index on expiresAt automatically expires guest carts
- [x] Pre-validate hook prevents carts without userId or sessionId
- [x] All monetary values stored as Number (cents)
- [x] All interfaces exported as TypeScript types
- [x] Barrel exports updated with CartModel and new interfaces

## Key Decisions

1. **Cents-based monetary storage:** All price/amount fields stored as integers (cents) to avoid JavaScript floating-point precision issues. Example: 1299 = $12.99.

2. **TTL with expireAfterSeconds: 0:** MongoDB evaluates expiresAt field value directly. If expiresAt is past current time, document auto-deletes on next TTL monitor pass (typically 60s). Setting expireAfterSeconds to 0 means "expire exactly at the expiresAt timestamp".

3. **Sparse indexes for userId/sessionId:** Cart documents can have null userId or sessionId. Sparse indexes only include documents where the field exists and is non-null, reducing index size and improving performance.

4. **Pre-validate hook for cart ownership:** Enforces business rule that every cart must be owned by either a guest or authenticated user. Throws validation error at save time if both are null.

5. **Denormalized cart items:** Store product name, price, imageUrl, sku at add-to-cart time. This preserves pricing snapshots and decouples cart from product catalog changes.

## Files Created/Modified

**Created:**
- packages/db/src/mongoose.ts (277 lines) — Complete rewrite with enriched Order and new Cart models
- packages/db/src/index.ts (12 lines) — Barrel exports with all new interfaces

**Modified:**
- package.json — Added tsx dev dependency
- pnpm-lock.yaml — Lockfile update for tsx

## Next Steps

1. Build Order management APIs in Phase 2 (order creation, status updates, admin workflows)
2. Build Cart APIs (add/remove items, guest-to-auth migration, coupon application)
3. Implement TTL cleanup monitoring (log expired carts for analytics)
4. Test guest cart expiration in local/staging environments
5. Add Mongoose connection pooling configuration for production

## Dependencies Satisfied

This plan completes requirements:
- SCHEMA-10: Order lifecycle tracking with status history
- SCHEMA-11: Cart persistence for guest and authenticated users

Unblocks:
- Order creation endpoints
- Cart management APIs
- Guest checkout flows
- Authenticated user cart sync

## Self-Check: PASSED

**Files exist:**
- packages/db/src/mongoose.ts: FOUND
- packages/db/src/index.ts: FOUND

**Commits exist:**
- fbc96c7: FOUND (feat(01-02): add enriched Order and new Cart Mongoose schemas)
- 296a2aa: FOUND (feat(01-02): update barrel exports with Cart model and interfaces)

**Exports verified:**
- OrderModel import: FOUND
- CartModel import: FOUND
- connectMongoDB type: function

All claims in this summary have been verified against repository state.
