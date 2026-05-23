---
phase: 09-cart-system
plan: "00"
subsystem: cart-test-infrastructure
tags: [testing, fixtures, vitest, cart, coupon]
dependency_graph:
  requires: []
  provides:
    - tests/setup.ts coupon mock
    - tests/fixtures/cart.fixtures.ts
    - tests/cart/ stub files (5 files, 45 todo)
  affects:
    - all subsequent cart plans (09-01 through 09-04)
tech_stack:
  added: []
  patterns:
    - it.todo() stubs for all CART requirements
    - Prisma mock extension pattern (vi.hoisted)
    - Cart fixture factory pattern (MongoDB shape)
key_files:
  created:
    - tests/fixtures/cart.fixtures.ts
    - tests/cart/cart-service.test.ts
    - tests/cart/cart-store.test.ts
    - tests/cart/coupon-validation.test.ts
    - tests/cart/stock-validation.test.ts
    - tests/cart/mini-cart-drawer.test.ts
  modified:
    - tests/setup.ts
decisions:
  - "[Phase 09-00]: coupon mock added to prismaMock in setup.ts following wishlist/shippingZone pattern"
  - "[Phase 09-00]: Cart fixtures use MongoDB shape (_id, userId/sessionId) distinct from Prisma shape"
  - "[Phase 09-00]: mockCartItemNoVariant uses variantId: undefined for simple product testing"
metrics:
  duration: 99s
  completed_date: "2026-03-14"
  tasks_completed: 2
  files_created: 6
  files_modified: 1
---

# Phase 9 Plan 0: Cart Test Infrastructure Summary

**One-liner:** Extended Prisma mocks with coupon model and created cart test infrastructure with 5 stub files (45 todo tests) covering all CART-01 through CART-09 requirements.

## What Was Built

- Added `coupon` mock to `prismaMock` in `tests/setup.ts` with all standard CRUD methods (findUnique, findMany, findFirst, create, update, delete, count)
- Created `tests/fixtures/cart.fixtures.ts` with 9 exports:
  - `mockCartItem` (with variantId), `mockCartItemNoVariant` (simple products)
  - `mockCoupon`, `mockExpiredCoupon`, `mockInactiveCoupon`, `mockFixedCoupon`, `mockFreeShippingCoupon`
  - `mockCart` (authenticated user, MongoDB shape), `mockGuestCart` (session-based)
- Created 5 test stub files under `tests/cart/` using `it.todo()` pattern:
  - `cart-service.test.ts` — 12 stubs covering CartService methods (CART-01, CART-03, CART-05)
  - `cart-store.test.ts` — 10 stubs covering Zustand store state (CART-02, CART-04, CART-06)
  - `coupon-validation.test.ts` — 10 stubs covering coupon validation logic (CART-07)
  - `stock-validation.test.ts` — 4 stubs covering stock status checks (CART-08)
  - `mini-cart-drawer.test.ts` — 9 stubs covering drawer UI behavior (CART-09)

## Verification Results

`npx vitest run tests/cart/ --passWithNoTests` output:
- 5 test files discovered
- 45 todo tests (all skipped)
- 0 failures

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 8ae0406 | chore(09-00): extend Prisma mocks with coupon model and create cart fixtures |
| Task 2 | f70b642 | test(09-00): add cart test stub files with it.todo() for all CART requirements |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED
