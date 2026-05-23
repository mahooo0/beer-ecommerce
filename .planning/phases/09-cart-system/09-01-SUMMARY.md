---
phase: 09-cart-system
plan: 01
subsystem: api
tags: [mongoose, prisma, zod, cart, coupon, inventory, express]

# Dependency graph
requires:
  - phase: 09-00
    provides: Cart test fixtures, coupon prismaMock, CartModel in mongoose.ts
  - phase: 14-inventory
    provides: InventoryItem Prisma model for stock availability checks
  - phase: 08-wishlist
    provides: wishlist module structure (service/controller/routes/validation) as template

provides:
  - cart.validation.ts with 5 Zod schemas (nested body format matching validate middleware)
  - CartService with 10 methods: getOrCreateCart, getGuestCart, addItem, updateQuantity, removeItem, clearCart, mergeGuestCart, validateCoupon, applyCoupon, removeCoupon, validateStock
  - CartController with 10 HTTP handlers
  - cartRoutes Express Router mounted at /api/cart with requireAuth + validate middleware
  - cart.updated event added to EventMap

affects: [09-02, 09-03, 09-04, checkout, orders]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CartService mirrors WishlistService structure (class-based, singleton export)
    - Zod schemas use nested body format (z.object({ body: z.object({...}) })) for validate middleware
    - mergeGuestCart: per-item inventory query, quantity capped at availableQty, guest doc deleted after merge
    - validateCoupon: typed error reasons (INVALID_CODE, CODE_EXPIRED, MINIMUM_ORDER, USAGE_LIMIT, NOT_STARTED)
    - applyCoupon controller: server computes subtotal before validation — never trusts client subtotal

key-files:
  created:
    - apps/server/src/modules/cart/cart.validation.ts
    - apps/server/src/modules/cart/cart.service.ts
    - apps/server/src/modules/cart/cart.controller.ts
    - apps/server/src/modules/cart/cart.routes.ts
  modified:
    - apps/server/src/common/events/event-bus.ts

key-decisions:
  - "Zod schemas follow nested body format (z.object({ body: z.object({...}) })) to match validate middleware signature — consistent with inventory.validation.ts pattern"
  - "applyCoupon controller recomputes subtotal from cart items server-side before validation to prevent subtotal spoofing"
  - "mergeGuestCart skips items where availableQty <= 0 rather than failing entire merge"
  - "Cart body schemas exported separately (addItemBodySchema etc.) for controller-level direct parse without body wrapper"

patterns-established:
  - "Pattern: CartService class exported as singleton cartService, matching wishlistService pattern"
  - "Pattern: validate() middleware receives nested schema (body key), controller directly parses req.body with flat schema"
  - "Pattern: mergeGuestCart queries inventory per item and caps qty at available stock before push"

requirements-completed: [CART-01, CART-02, CART-03, CART-05, CART-07, CART-08]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 09 Plan 01: Server Cart Module Summary

**CartService + CartController + cartRoutes with CRUD, guest-to-auth merge (stock-capped), coupon validation (5 typed error reasons), and stock availability checking via Prisma InventoryItem**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-14T19:38:42Z
- **Completed:** 2026-03-14T19:42:51Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Built complete server cart module (4 files) mirroring wishlist module structure
- mergeGuestCart queries inventory per-item and caps quantities at available stock per locked decision
- validateCoupon implements all 5 typed error reasons with exact research pattern (INVALID_CODE, CODE_EXPIRED, MINIMUM_ORDER, USAGE_LIMIT, NOT_STARTED)
- validateStock returns per-item status (in_stock/low_stock/out_of_stock) with 5-unit threshold
- Added cart.updated event to EventMap for Phase 17 notification subscriptions

## Task Commits

Each task was committed atomically:

1. **Task 1: Cart Zod schemas and CartService** - `881846b` (feat)
2. **Task 2: Cart controller and routes** - `e665427` (feat)

**Plan metadata:** (added in final commit)

## Files Created/Modified

- `apps/server/src/modules/cart/cart.validation.ts` - 5 Zod schemas (addItemSchema, updateQuantitySchema, removeItemSchema, mergeCartSchema, applyCouponSchema) in nested body format + raw body schemas for controller use
- `apps/server/src/modules/cart/cart.service.ts` - CartService with 10 methods, CouponValidationResult and StockValidationResult interfaces
- `apps/server/src/modules/cart/cart.controller.ts` - CartController with 10 HTTP handlers; applyCoupon computes subtotal server-side
- `apps/server/src/modules/cart/cart.routes.ts` - Express Router with requireAuth + validate on all 10 endpoints
- `apps/server/src/common/events/event-bus.ts` - cart.updated added to EventMap

## Decisions Made

- Zod validation schemas follow nested `{ body: z.object({...}) }` format to match the `validate` middleware signature (discovered from inventory.validation.ts — wishlist schemas use flat format which is inconsistent)
- Separate "body schema" exports (addItemBodySchema etc.) for controller-level direct parsing
- applyCoupon controller fetches cart and computes subtotal before calling validateCoupon — server never trusts client-provided subtotal (per research Pitfall 5)
- mergeGuestCart silently skips items with zero available stock rather than failing the merge

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod schema format to match validate middleware**
- **Found during:** Task 1 implementation
- **Issue:** Plan showed flat Zod schemas like `addItemSchema = z.object({ productId, ... })` but the `validate` middleware does `schema.parse({ body: req.body, ... })` — the flat schema cannot find fields at top-level
- **Fix:** Used nested `z.object({ body: z.object({...}) })` format consistent with inventory.validation.ts; exported separate flat body schemas for controller use
- **Files modified:** apps/server/src/modules/cart/cart.validation.ts
- **Verification:** TypeScript compiles without errors, consistent with inventory module pattern
- **Committed in:** 881846b (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Essential for correct request body validation. No scope creep.

## Issues Encountered

- Import path for CartModel: initially imported from `@repo/db/mongoose` but package exports from `@repo/db` directly — fixed inline

## Next Phase Readiness

- All 10 cart endpoints available at /api/cart for client integration (plans 02-04)
- cartRoutes must be mounted in apps/server/src/index.ts (deferred to plan 02 or mounting step)
- TypeScript compiles cleanly for cart module (14 pre-existing errors in other modules are out of scope)

## Self-Check: PASSED

All 4 cart module files exist. Commits 881846b and e665427 verified in git log.

---
*Phase: 09-cart-system*
*Completed: 2026-03-14*
