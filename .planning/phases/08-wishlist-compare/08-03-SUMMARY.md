---
phase: 08-wishlist-compare
plan: "03"
subsystem: ui
tags: [zustand, clerk, react, nextjs, wishlist]

requires:
  - phase: 08-01
    provides: Wishlist API routes (GET /api/wishlist, POST /api/wishlist, DELETE /api/wishlist/:productId, POST /api/wishlist/sync, PATCH /api/wishlist/:productId/notify)
  - phase: 08-02
    provides: WishlistButton component and wishlist-store Zustand store

provides:
  - /wishlist page with product grid, price-drop badges, and notify toggles
  - PriceDropBadge component for comparing priceAtAdd vs current price
  - useWishlistSync hook for silent guest-to-auth data merge on login
  - WishlistHeaderBadge with heart icon + count in site header
  - Wishlist toggle on product detail page below product title

affects:
  - 17-notifications (WishlistPriceDropEvent/WishlistRestockEvent notify toggles wired)
  - Any phase touching layout.tsx

tech-stack:
  added: []
  patterns:
    - useRef(false) guard to prevent double-sync on re-render
    - WishlistHeaderBadge calls useWishlistSync at layout level — single sync point
    - Hydration-safe count badge: renders 0 until mounted, then real count

key-files:
  created:
    - apps/client/src/hooks/use-wishlist-sync.ts
    - apps/client/src/components/wishlist/price-drop-badge.tsx
    - apps/client/src/app/wishlist/page.tsx
    - apps/client/src/app/wishlist/wishlist-page-client.tsx
    - apps/client/src/components/wishlist/wishlist-header-badge.tsx
  modified:
    - apps/client/src/app/products/[slug]/product-page-client.tsx
    - apps/client/src/app/layout.tsx

key-decisions:
  - "useWishlistSync placed inside WishlistHeaderBadge rather than a separate provider — one fewer component in tree"
  - "WishlistHeaderBadge handles hydration via mounted flag — renders heart without count until client hydrates"
  - "Guest wishlist fetch skips product detail API — shows productId as fallback when product data unavailable"

patterns-established:
  - "Price-drop badge: compare priceAtAdd (snapshot) vs currentPrice — null if no drop"
  - "Notify toggles: PATCH /api/wishlist/:productId/notify, shown only for authenticated users"

requirements-completed: [WISH-01, WISH-02, WISH-03, WISH-06]

duration: 5min
completed: 2026-03-12
---

# Phase 8 Plan 3: Wishlist UX — Page, Badge, Sync Hook, and Header

**Wishlist page with product grid and price-drop badges, guest-to-auth silent sync via useRef guard, heart icon in header with count badge, and product page wishlist toggle**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T10:02:58Z
- **Completed:** 2026-03-12T10:07:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- /wishlist page renders product grid with per-item price-drop badges and notify toggles (auth only)
- useWishlistSync fires once per login session via useRef(false) guard, syncs guest items then refreshes from server
- Header shows heart SVG with red count badge (hydration-safe — 0 until mounted)
- Product detail page has inline "Add to Wishlist" toggle below product title

## Task Commits

Each task was committed atomically:

1. **Task 1: Wishlist page, price-drop badge, and sync hook** - `578f0d8` (feat)
2. **Task 2: Product detail page wishlist toggle and header badge** - `c9014f5` (feat)

## Files Created/Modified
- `apps/client/src/hooks/use-wishlist-sync.ts` - Guest-to-auth sync hook with useRef guard
- `apps/client/src/components/wishlist/price-drop-badge.tsx` - Green badge when currentPrice < priceAtAdd
- `apps/client/src/app/wishlist/page.tsx` - Server component with metadata
- `apps/client/src/app/wishlist/wishlist-page-client.tsx` - Client island with grid, empty state, notify toggles
- `apps/client/src/components/wishlist/wishlist-header-badge.tsx` - Heart icon + count badge for header
- `apps/client/src/app/products/[slug]/product-page-client.tsx` - Added WishlistButton below title
- `apps/client/src/app/layout.tsx` - Added WishlistHeaderBadge before cart link

## Decisions Made
- useWishlistSync placed inside WishlistHeaderBadge rather than a separate provider to reduce component tree depth
- Hydration handled via `mounted` state flag — count badge renders only after client-side mount
- Guest wishlist page shows items from Zustand store directly without fetching product details (saves an API round-trip)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed WishlistButton prop name mismatch**
- **Found during:** Task 1 (wishlist page client)
- **Issue:** Plan specified `priceAtAdd` prop but WishlistButton from 08-02 uses `price`
- **Fix:** Used `price={currentPrice}` to match existing interface
- **Files modified:** apps/client/src/app/wishlist/wishlist-page-client.tsx
- **Verification:** TypeScript compiles without wishlist errors
- **Committed in:** 578f0d8 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug - prop name mismatch)
**Impact on plan:** Trivial fix for interface alignment. No scope creep.

## Issues Encountered
- None beyond the prop name mismatch above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 08 wishlist feature complete: API, stores, UI, and UX all delivered
- WishlistPriceDropEvent and WishlistRestockEvent notify toggle endpoints ready for Phase 17 Notifications
- No blockers

---
*Phase: 08-wishlist-compare*
*Completed: 2026-03-12*
