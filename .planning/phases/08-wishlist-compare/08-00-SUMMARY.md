---
phase: 08-wishlist-compare
plan: 00
subsystem: testing
tags: [prisma, vitest, zustand, wishlist, compare, price-drop]

# Dependency graph
requires:
  - phase: 03-product-management
    provides: "Vitest test infrastructure, prismaMock pattern, it.todo() stub convention"
  - phase: 14-inventory-management
    provides: "Extended prismaMock with warehouse/inventoryItem/stockMovement"

provides:
  - "WishlistItem.priceAtAdd field in Prisma schema and TypeScript types"
  - "WishlistPriceDropEvent and WishlistRestockEvent types exported from @repo/types"
  - "wishlist and wishlistItem mocks in prismaMock (tests/setup.ts)"
  - "Shared test fixtures: mockWishlist, mockWishlistItem, mockWishlistItemWithProduct, mockCompareProducts"
  - "Test stub files for all wishlist and compare features (160 todos)"

affects:
  - 08-wishlist-compare (plans 01-05 all depend on this infrastructure)
  - 17-notifications (WishlistPriceDropEvent and WishlistRestockEvent types)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "it.todo() stubs document expected behavior and enable test tracking before implementation"
    - "priceAtAdd stored as Int (cents) in WishlistItem — mirrors cart item price snapshot pattern"
    - "Shared fixtures file (wishlist.fixtures.ts) provides mock data across wishlist test suite"

key-files:
  created:
    - tests/fixtures/wishlist.fixtures.ts
    - tests/wishlist/wishlist-service.test.ts
    - tests/wishlist/wishlist-events.test.ts
    - tests/wishlist/wishlist-store.test.ts
    - tests/wishlist/wishlist-button.test.ts
    - tests/wishlist/wishlist-sync.test.ts
    - tests/wishlist/wishlist-page.test.ts
    - tests/wishlist/price-drop-badge.test.ts
    - tests/compare/compare-store.test.ts
    - tests/compare/compare-bar.test.ts
    - tests/compare/compare-page.test.ts
  modified:
    - packages/db/prisma/schema.prisma
    - packages/types/src/index.ts
    - tests/setup.ts

key-decisions:
  - "priceAtAdd stored as Int @default(0) in WishlistItem to capture price-at-add-time for price-drop badge display"
  - "wishlist and wishlistItem mocks added to setup.ts alongside existing model mocks — consistent prismaMock pattern"
  - "WishlistPriceDropEvent and WishlistRestockEvent added to types for EventBus integration in Phase 17"

patterns-established:
  - "Wishlist fixtures file separates wishlist domain data from main setup.ts product fixtures"
  - "Test stubs cover 7 test files with 160 todo markers across wishlist and compare domains"

requirements-completed: [WISH-01, WISH-02, WISH-03, WISH-04, WISH-05, WISH-06]

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 8 Plan 00: Wishlist & Compare — Infrastructure Summary

**WishlistItem.priceAtAdd schema field added, event types exported, and 160 test stubs created across 10 files covering wishlist service, store, UI, sync, events, compare store, bar, and page**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-12T13:50:00Z
- **Completed:** 2026-03-12T13:56:00Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Added `priceAtAdd Int @default(0)` to WishlistItem Prisma model and TypeScript interface
- Added `WishlistPriceDropEvent` and `WishlistRestockEvent` types to `@repo/types` for Phase 17 integration
- Extended `prismaMock` in tests/setup.ts with `wishlist` and `wishlistItem` mocks (all CRUD methods)
- Created shared fixtures file with `mockWishlist`, `mockWishlistItem`, `mockWishlistItemWithProduct`, `mockCompareProducts`
- Created 8 test stub files (160 todos) for wishlist store, button, sync, page, price-drop badge, compare store, bar, and page

## Task Commits

Each task was committed atomically:

1. **Task 1: Add priceAtAdd to WishlistItem schema and update types** - `e5d404a` (feat)
2. **Task 2: Test infrastructure — mocks, fixtures, and test stubs** - `b6dd799` (test)

## Files Created/Modified

- `packages/db/prisma/schema.prisma` - Added priceAtAdd field to WishlistItem model
- `packages/types/src/index.ts` - Added priceAtAdd to WishlistItem interface, added WishlistPriceDropEvent and WishlistRestockEvent
- `tests/setup.ts` - Added wishlist and wishlistItem mocks to prismaMock
- `tests/fixtures/wishlist.fixtures.ts` - Shared fixtures: mockWishlist, mockWishlistItem, mockWishlistItemWithProduct, mockCompareProducts
- `tests/wishlist/wishlist-service.test.ts` - 23 stubs for getWishlist, addItem, removeItem, syncItems, updateNotifyPrefs
- `tests/wishlist/wishlist-events.test.ts` - 12 stubs for priceDrop and restock event handling
- `tests/wishlist/wishlist-store.test.ts` - 21 stubs for Zustand store (guest/auth/sync)
- `tests/wishlist/wishlist-button.test.ts` - 12 stubs for heart icon toggle component
- `tests/wishlist/wishlist-sync.test.ts` - 12 stubs for guest-to-auth sync endpoint
- `tests/wishlist/wishlist-page.test.ts` - 18 stubs for /wishlist page
- `tests/wishlist/price-drop-badge.test.ts` - 10 stubs for PriceDropBadge component
- `tests/compare/compare-store.test.ts` - 17 stubs for Zustand compare store (max-4, persistence)
- `tests/compare/compare-bar.test.ts` - 17 stubs for floating CompareBar component
- `tests/compare/compare-page.test.ts` - 18 stubs for /compare page with diff highlighting

## Decisions Made

- `priceAtAdd` stored as `Int @default(0)` — consistent with project-wide monetary values as cents convention; default 0 means "no snapshot" which is safe and avoids nullable complexity
- `wishlist` and `wishlistItem` mocks added to shared `prismaMock` in setup.ts — consistent with existing pattern for shipping, inventory mocks
- Event types (`WishlistPriceDropEvent`, `WishlistRestockEvent`) added now so Phase 17 Notifications can consume them without schema changes

## Deviations from Plan

None — plan executed exactly as written. The 8 stub files listed as "missing" in the execution context were all created as part of Task 2 completion.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema, types, and test infrastructure are fully ready for plans 01-05
- Plan 01 (WishlistService implementation) can immediately consume prismaMock.wishlist and prismaMock.wishlistItem
- Plan 02 (Event handlers) can consume WishlistPriceDropEvent and WishlistRestockEvent types from @repo/types
- All 160 test stubs serve as implementation contracts for plans 01-05

---
*Phase: 08-wishlist-compare*
*Completed: 2026-03-12*
