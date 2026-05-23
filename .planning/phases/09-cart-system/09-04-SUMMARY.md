---
phase: 09-cart-system
plan: "04"
subsystem: ui
tags: [react, zustand, cart, clerk, typescript, tailwind]

# Dependency graph
requires:
  - phase: 09-02
    provides: useCartStore coupon state, api.cart namespace

provides:
  - CouponSection: expandable promo code input with validation feedback and removable chip
  - PriceSummary: subtotal, discount, shipping/tax placeholders, total breakdown
  - StockWarning: per-item stock status badge (in_stock=null, low_stock=amber, out_of_stock=red)
  - CartPageClient: full cart management UI with 2-col lg layout, stock validation, coupon, price summary
  - /cart route: Server Component with metadata and CartPageClient island

affects:
  - 10-checkout-flow (cart page provides entry point to checkout)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component thin wrapper with Client island (CartPageClient pattern)
    - Hydration-safe mounting: useEffect sets mounted=true, skeleton renders until mounted
    - Fire-and-forget background API sync for authenticated cart mutations
    - Stock validation on mount + on items change via useEffect dependency array
    - Checkout button disabled with inline message when out-of-stock items detected

key-files:
  created:
    - apps/client/src/components/cart/coupon-section.tsx
    - apps/client/src/components/cart/price-summary.tsx
    - apps/client/src/components/cart/stock-warning.tsx
    - apps/client/src/app/cart/cart-page-client.tsx
  modified:
    - apps/client/src/app/cart/page.tsx

key-decisions:
  - "CartItemRow from Plan 03 already existed in the repo — reused without recreation (Rule 3 fix not needed)"
  - "Fire-and-forget pattern for cart mutations: Zustand update is optimistic, API call runs in background for auth users"
  - "Stock validation fires on both mount and items change via useEffect dependency — validates on page load and quantity change"
  - "Checkout button disabled inline (not via Link disabled prop) to allow tooltip-style message display"

patterns-established:
  - "CouponSection calls api.cart.applyCoupon for authenticated users, api.cart.validateCoupon for guests"
  - "StockWarning returns null for in_stock — zero DOM for the happy path"

requirements-completed:
  - CART-05
  - CART-06
  - CART-07
  - CART-08
  - CART-09

# Metrics
duration: 3min
completed: "2026-03-14"
---

# Phase 09 Plan 04: Cart Page Summary

**Full cart page with CouponSection (expandable promo input with validation), PriceSummary (line-item breakdown with You-save callout), StockWarning badges, and CartPageClient island with 2-column responsive layout and out-of-stock checkout gate**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-14T20:10:23Z
- **Completed:** 2026-03-14T20:13:23Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created `coupon-section.tsx`: expandable "Have a promo code?" with input, Apply button, inline error display, and removable green chip when applied. Handles both authenticated (api.cart.applyCoupon) and guest (api.cart.validateCoupon) flows.
- Created `price-summary.tsx`: subtotal, discount line (green with "You save" callout, only when coupon active), shipping/tax "Calculated at checkout" in gray, horizontal divider, bold total.
- Created `stock-warning.tsx`: `in_stock` returns null, `low_stock` shows amber badge with available count, `out_of_stock` shows red badge.
- Converted existing `cart/page.tsx` from client component to Server Component with Next.js metadata export.
- Created `cart-page-client.tsx`: full cart UI with hydration-safe mounting, 2-col lg layout (items 2/3, summary 1/3), per-item StockWarning, sticky order summary, CouponSection + PriceSummary wired to Zustand, checkout disabled when out-of-stock items present, empty state with shopping bag icon.

## Task Commits

Each task was committed atomically:

1. **Task 1: CouponSection, PriceSummary, and StockWarning components** - `e984e9f` (feat)
2. **Task 2: Cart page Server Component wrapper and CartPageClient island** - `396dca5` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `apps/client/src/components/cart/coupon-section.tsx` - New: expandable coupon input component
- `apps/client/src/components/cart/price-summary.tsx` - New: price breakdown component
- `apps/client/src/components/cart/stock-warning.tsx` - New: per-item stock status badge
- `apps/client/src/app/cart/page.tsx` - Modified: converted to Server Component with metadata
- `apps/client/src/app/cart/cart-page-client.tsx` - New: client island with full cart UI

## Decisions Made

- CartItemRow from Plan 03 already existed in the repo — reused as-is
- Fire-and-forget pattern for authenticated cart mutations: Zustand state updates optimistically, API calls run in background
- Stock validation triggers on both initial mount and whenever items array changes
- Checkout button is rendered as a `<button disabled>` rather than a disabled `<Link>` to allow the error message below it

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CartItemRow already existed from uncommitted Plan 03 work**
- **Found during:** Task 2 (CartPageClient setup)
- **Issue:** Plan 04 references CartItemRow "from Plan 03" but Plan 03 had no SUMMARY.md and was assumed not executed. Files were already present.
- **Fix:** Read existing cart-item-row.tsx and used it directly — no recreation needed
- **Files modified:** None (no deviation, just discovery)

## Issues Encountered

None — pre-existing TypeScript errors in unrelated files (ChatWidget, profile/page.tsx, search-results-page.tsx, filter components) are out of scope and not introduced by this plan.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `/cart` route fully functional with all cart management features
- CouponSection, PriceSummary, StockWarning components ready for reuse in checkout flow
- Cart mutations sync to server for authenticated users via fire-and-forget pattern
- Phase 10 checkout can link directly from Checkout button at /checkout

## Self-Check: PASSED

All files verified present. Both task commits confirmed in git log.

---
*Phase: 09-cart-system*
*Completed: 2026-03-14*
