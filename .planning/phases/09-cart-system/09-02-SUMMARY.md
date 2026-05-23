---
phase: 09-cart-system
plan: "02"
subsystem: api
tags: [zustand, cart, hooks, react, clerk, typescript]

# Dependency graph
requires:
  - phase: 09-01
    provides: cartRoutes, CartService, cart module with coupon/merge/stock validation endpoints

provides:
  - Extended Zustand cart store with coupon state (couponCode, discountAmount, applyCoupon, removeCoupon, subtotal, setItems)
  - useCartSync hook for sequential guest-to-auth cart merge on login
  - api.cart namespace with 10 typed methods
  - Server cart routes wired at /api/cart

affects:
  - 10-checkout-flow
  - any phase consuming cart state or api.cart

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Sequential await pattern for cart merge (POST merge then GET cart) to prevent stale data
    - Clerk token forwarding via Authorization Bearer header in all cart API methods
    - Zustand computed methods (subtotal, totalItems) use get() for derived state

key-files:
  created:
    - apps/client/src/hooks/use-cart-sync.ts
  modified:
    - apps/client/src/stores/cart-store.ts
    - apps/client/src/lib/api.ts
    - apps/server/src/index.ts

key-decisions:
  - "Sequential merge-then-fetch in useCartSync: await POST /api/cart/merge before GET /api/cart to prevent stale cart hydration"
  - "api.cart methods all accept token as last parameter and forward via Authorization Bearer — consistent with server auth middleware"
  - "cart.updated EventMap entry was already present from Plan 01 — no change required"

patterns-established:
  - "useCartSync mirrors useWishlistSync structure but uses sequential await instead of fire-and-forget for merge"
  - "setItems used for server cart hydration — replaces entire items array from authoritative server state"

requirements-completed:
  - CART-02
  - CART-03
  - CART-04
  - CART-06

# Metrics
duration: 2min
completed: "2026-03-14"
---

# Phase 09 Plan 02: Client Cart Integration Summary

**Zustand cart store extended with coupon state, useCartSync hook wires sequential guest-to-auth merge, and api.cart namespace exposes all 10 cart endpoint methods with Clerk token forwarding**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-14T19:45:39Z
- **Completed:** 2026-03-14T19:47:39Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Extended cart-store.ts with couponCode, discountAmount, applyCoupon, removeCoupon, subtotal, setItems — all coupon lifecycle operations in the store
- Created use-cart-sync.ts hook with correct sequential await pattern: merge POST completes before GET is issued, preventing stale cart hydration
- Added api.cart namespace to api.ts with all 10 typed methods, each forwarding Clerk JWT via Authorization Bearer header
- Wired cartRoutes into server index.ts at /api/cart after wishlistRoutes

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend cart store and create useCartSync hook** - `aee4416` (feat)
2. **Task 2: Extend API client and wire server routes** - `feb37c8` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/client/src/stores/cart-store.ts` - Added couponCode, discountAmount, applyCoupon, removeCoupon, subtotal, setItems
- `apps/client/src/hooks/use-cart-sync.ts` - New hook for guest-to-auth cart sync on login with sequential merge
- `apps/client/src/lib/api.ts` - Added CartItem import and cart namespace with 10 methods
- `apps/server/src/index.ts` - Import cartRoutes and mount at /api/cart

## Decisions Made
- Sequential await pattern in useCartSync: plan explicitly warned against fire-and-forget for merge (Pitfall 3) — await POST merge, then await GET cart
- api.cart methods accept token as last param (not first) matching existing namespaces in api.ts
- cart.updated EventMap entry required no change — it was already added during Plan 01 execution

## Deviations from Plan

None - plan executed exactly as written. cart.updated was already in event-bus.ts from Plan 01, counted as pre-existing.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Client cart store fully hydrated on login via useCartSync
- All server cart endpoints accessible via api.cart namespace
- Ready for Phase 10 checkout flow which will consume cart state and api.cart methods

## Self-Check: PASSED

All files verified present. Both task commits confirmed in git log.

---
*Phase: 09-cart-system*
*Completed: 2026-03-14*
