---
phase: 09-cart-system
verified: 2026-03-14T21:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Open mini cart drawer from any page"
    expected: "Drawer slides in from right with overlay, body scroll locks, items visible with qty stepper"
    why_human: "CSS transition and scroll-lock behavior cannot be verified statically"
  - test: "Apply a coupon code in CouponSection (authenticated)"
    expected: "Code validated server-side, error message shown inline on failure, green chip appears on success"
    why_human: "Interactive form flow requires live API and UI state transitions"
  - test: "Add items as guest, then sign in"
    expected: "useCartSync fires POST /api/cart/merge sequentially then GET /api/cart; merged cart replaces local state"
    why_human: "Runtime Clerk auth lifecycle cannot be verified statically"
  - test: "Cart page checkout button with out-of-stock item"
    expected: "Button is disabled and message 'Remove out-of-stock items to continue' appears below"
    why_human: "Requires live stock validation API response to trigger disabled state"
---

# Phase 9: Cart System Verification Report

**Phase Goal:** Users can build and manage a shopping cart that persists across sessions with guest/auth support, cart merging, and real-time price calculation
**Verified:** 2026-03-14
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Server can CRUD cart items in MongoDB | VERIFIED | `CartService` implements `addItem`, `updateQuantity`, `removeItem`, `clearCart` all calling `CartModel` with save and event emission |
| 2 | Guest cart merges with auth cart on login (quantities capped at stock) | VERIFIED | `mergeGuestCart` queries `prisma.inventoryItem.findMany` per item, caps qty with `Math.min(authQty + guestQty, availableQty)`, deletes guest doc via `CartModel.deleteOne` |
| 3 | Server validates coupon codes with typed error reasons | VERIFIED | `validateCoupon` checks INVALID_CODE, NOT_STARTED, CODE_EXPIRED, USAGE_LIMIT, MINIMUM_ORDER — all 5 typed reasons returned |
| 4 | Server validates stock availability per item | VERIFIED | `validateStock` queries `prisma.inventoryItem.findMany` per item, applies LOW_STOCK_THRESHOLD=5, returns `in_stock / low_stock / out_of_stock` |
| 5 | Zustand cart store persists across browser sessions with coupon state | VERIFIED | `useCartStore` uses `persist` middleware (`name: 'cart-storage'`); interface includes `couponCode`, `discountAmount`, `applyCoupon`, `removeCoupon`, `subtotal`, `setItems` |
| 6 | Guest-to-auth merge fires sequentially on login (merge then fetch) | VERIFIED | `useCartSync` awaits POST `/api/cart/merge` before issuing GET `/api/cart`; `syncedRef` prevents re-sync |
| 7 | Cart routes mounted at /api/cart in server | VERIFIED | `apps/server/src/index.ts` line 51: `app.use('/api/cart', cartRoutes)` |
| 8 | Mini cart drawer accessible from header on all pages | VERIFIED | `CartHeaderButton` (with `useCartSync`) is imported in root `apps/client/src/app/layout.tsx`; renders `MiniCartDrawer` with CSS slide transition |
| 9 | Full cart page with coupon, price breakdown, stock warnings, checkout gate | VERIFIED | `CartPageClient` uses `CouponSection`, `PriceSummary`, `StockWarning`, `CartItemRow`; checkout button disabled when `hasOutOfStockItems` |

**Score: 9/9 truths verified**

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/setup.ts` | Coupon Prisma mock added | VERIFIED | Lines 109-117: `coupon` mock with findUnique, findMany, findFirst, create, update, delete, count |
| `tests/fixtures/cart.fixtures.ts` | Cart and coupon test fixtures | VERIFIED | Exports: `mockCartItem`, `mockCartItemNoVariant`, `mockCoupon`, `mockExpiredCoupon`, `mockInactiveCoupon`, `mockFixedCoupon`, `mockFreeShippingCoupon`, `mockCart`, `mockGuestCart` (9 exports) |
| `tests/cart/cart-service.test.ts` | Service test stubs | VERIFIED | File exists (it.todo stubs for CART-01, CART-03, CART-05) |
| `tests/cart/cart-store.test.ts` | Store test stubs | VERIFIED | File exists (it.todo stubs for CART-02, CART-04, CART-06) |
| `tests/cart/coupon-validation.test.ts` | Coupon test stubs | VERIFIED | File exists (it.todo stubs for CART-07) |
| `tests/cart/stock-validation.test.ts` | Stock test stubs | VERIFIED | File exists (it.todo stubs for CART-08) |
| `tests/cart/mini-cart-drawer.test.ts` | Mini cart test stubs | VERIFIED | File exists (it.todo stubs for CART-09) |
| `apps/server/src/modules/cart/cart.validation.ts` | 5 Zod schemas + body variants | VERIFIED | Exports: `addItemSchema`, `updateQuantitySchema`, `removeItemSchema`, `mergeCartSchema`, `applyCouponSchema` (nested body format) + 5 raw body schema variants |
| `apps/server/src/modules/cart/cart.service.ts` | CartService with 10 methods | VERIFIED | Exports `CartService` class + `cartService` singleton; all 10 methods implemented: `getOrCreateCart`, `getGuestCart`, `addItem`, `updateQuantity`, `removeItem`, `clearCart`, `mergeGuestCart`, `validateCoupon`, `applyCoupon`, `removeCoupon`, `validateStock` |
| `apps/server/src/modules/cart/cart.controller.ts` | CartController with 10 handlers | VERIFIED | Exports `CartController` class + `cartController` singleton; all 10 handlers implemented |
| `apps/server/src/modules/cart/cart.routes.ts` | Express router at /api/cart | VERIFIED | Exports `cartRoutes`; all 10 endpoints mounted with `requireAuth` + `validate` middleware |
| `apps/client/src/stores/cart-store.ts` | Zustand store with coupon state | VERIFIED | Exports `useCartStore`; interface has `couponCode`, `discountAmount`, `applyCoupon`, `removeCoupon`, `subtotal`, `setItems`; uses `persist` middleware |
| `apps/client/src/hooks/use-cart-sync.ts` | Guest-to-auth cart sync hook | VERIFIED | Exports `useCartSync`; sequential await pattern; `syncedRef` prevents re-sync; updates `setItems` and `applyCoupon` from server response |
| `apps/client/src/lib/api.ts` | api.cart namespace with 10 methods | VERIFIED | `cart:` namespace has all 10 methods: get, addItem, updateQuantity, removeItem, clear, merge, applyCoupon, removeCoupon, validateCoupon, validateStock |
| `apps/server/src/index.ts` | Cart routes mounted | VERIFIED | `import { cartRoutes }` + `app.use('/api/cart', cartRoutes)` |
| `apps/server/src/common/events/event-bus.ts` | cart.updated EventMap entry | VERIFIED | Line 16: `'cart.updated': { cartId: string; userId?: string; sessionId?: string; itemCount: number }` |
| `apps/client/src/components/cart/cart-header-button.tsx` | Cart icon with badge + useCartSync | VERIFIED | Exports `CartHeaderButton`; mounts `useCartSync()`; hydration-safe count badge; renders `MiniCartDrawer` |
| `apps/client/src/components/cart/mini-cart-drawer.tsx` | Slide-out drawer | VERIFIED | Exports `MiniCartDrawer`; controlled `open`/`onClose` props; CSS `translate-x` transition; overlay; body scroll lock; item list via `CartItemRow`; empty state; footer with subtotal + View Cart + Checkout |
| `apps/client/src/components/cart/cart-item-row.tsx` | Cart item with stepper and remove | VERIFIED | Exports `CartItemRow`; thumbnail via `next/image` with fallback; variant attributes display; qty stepper (+/-) disabled at 1; line total; trash icon remove button |
| `apps/client/src/app/layout.tsx` | CartHeaderButton in header | VERIFIED | Imports `CartHeaderButton`; renders `<CartHeaderButton />` in header |
| `apps/client/src/components/cart/coupon-section.tsx` | Expandable promo code input | VERIFIED | Exports `CouponSection`; "Have a promo code?" toggle; red border on error; green chip when applied; authenticated uses `api.cart.applyCoupon`; guest uses `api.cart.validateCoupon` |
| `apps/client/src/components/cart/price-summary.tsx` | Price breakdown | VERIFIED | Exports `PriceSummary`; subtotal, discount line (green, "You save"), shipping/tax "Calculated at checkout", bold total |
| `apps/client/src/components/cart/stock-warning.tsx` | Per-item stock badge | VERIFIED | Exports `StockWarning`; `in_stock` returns null; `low_stock` = amber badge with count; `out_of_stock` = red badge |
| `apps/client/src/app/cart/page.tsx` | Server Component with metadata | VERIFIED | No `'use client'`; exports `metadata` with title/description; renders `<CartPageClient />` |
| `apps/client/src/app/cart/cart-page-client.tsx` | Full cart UI client island | VERIFIED | Exports `CartPageClient`; hydration-safe mounting; 2-col lg layout; stock validation on mount + items change; checkout button disabled on out-of-stock; empty state; fire-and-forget server sync for mutations |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `cart.service.ts` | CartModel | mongoose model import | WIRED | `CartModel.findOne`, `.create`, `.deleteOne` — all present |
| `cart.service.ts` | prisma.coupon | Prisma client | WIRED | `prisma.coupon.findUnique` in `validateCoupon` |
| `use-cart-sync.ts` | `/api/cart/merge` | fetch POST on login | WIRED | `await fetch('/api/cart/merge', ...)` at line 28 |
| `use-cart-sync.ts` | `/api/cart` | fetch GET for server cart | WIRED | `await fetch('/api/cart', ...)` at line 39, after merge resolves |
| `apps/server/src/index.ts` | `cart.routes.ts` | `app.use('/api/cart')` | WIRED | Line 51: `app.use('/api/cart', cartRoutes)` |
| `cart-header-button.tsx` | `cart-store.ts` | useCartStore for badge count | WIRED | `useCartStore((s) => s.totalItems)` |
| `cart-header-button.tsx` | `use-cart-sync.ts` | useCartSync() call | WIRED | `useCartSync()` called at component body |
| `mini-cart-drawer.tsx` | `cart-store.ts` | useCartStore for items/mutations | WIRED | `useCartStore` called for items, subtotal, totalItems, updateQuantity, removeItem |
| `coupon-section.tsx` | `/api/cart/coupon` | api.cart.applyCoupon | WIRED | `api.cart.applyCoupon(inputValue, token)` in handleApply |
| `cart-page-client.tsx` | `cart-store.ts` | useCartStore for state | WIRED | Multiple `useCartStore((s) => ...)` selectors |
| `cart-page-client.tsx` | `/api/cart/stock-validation` | api.cart.validateStock on mount | WIRED | `api.cart.validateStock(token)` in useEffect on mount + items change |

---

### Requirements Coverage

| Requirement | Description | Plans | Status | Evidence |
|-------------|-------------|-------|--------|----------|
| CART-01 | User can add products to cart with selected variant, quantity | 00, 01 | SATISFIED | `CartService.addItem` handles existing item qty increment + new item push; `addItemSchema` validates body |
| CART-02 | Cart supports guest users (localStorage) and authenticated users (database) | 00, 01, 02 | SATISFIED | Zustand `persist` middleware for guests; `CartModel.findOne({ userId })` for auth; `getGuestCart` via `sessionId` |
| CART-03 | Guest cart merges with authenticated cart on login | 00, 01, 02 | SATISFIED | `mergeGuestCart` on server; `useCartSync` fires POST `/api/cart/merge` on `isSignedIn` |
| CART-04 | Cart persists across browser sessions | 00, 02 | SATISFIED | Zustand `persist` with `name: 'cart-storage'` (localStorage); server MongoDB TTL cart for auth users |
| CART-05 | User can update quantity, remove items, and clear cart | 00, 01, 04 | SATISFIED | `updateQuantity`, `removeItem`, `clearCart` in CartService + CartController + CartPageClient; fire-and-forget server sync for auth users |
| CART-06 | Cart shows real-time price calculation (subtotal, tax, shipping) | 00, 02, 04 | SATISFIED | `subtotal()` computed in Zustand; `PriceSummary` shows subtotal, discount, shipping/tax "Calculated at checkout", bold total |
| CART-07 | User can apply coupon/promo codes with validation feedback | 00, 01, 04 | SATISFIED | `validateCoupon` returns 5 typed error reasons; `CouponSection` shows inline errors, green chip on success; guest uses `validateCoupon`, auth uses `applyCoupon` |
| CART-08 | Cart validates stock availability and shows warnings | 00, 01, 04 | SATISFIED | `validateStock` queries inventory per item; `StockWarning` renders amber/red badges; `CartPageClient` disables checkout on out-of-stock |
| CART-09 | Mini cart accessible from header on all pages | 00, 03, 04 | SATISFIED | `CartHeaderButton` in root layout renders `MiniCartDrawer` with slide-out transition, item list, footer; full cart page at `/cart` with all management features |

**All 9 requirements satisfied.**

---

### Anti-Patterns Found

No blockers or warnings detected across all phase files.

- No `TODO`/`FIXME` in server cart module
- No stub implementations (`return {}`, `return []`, placeholder handlers)
- `it.todo()` stubs in test files are intentional Wave 0 scaffolding — not implementation gaps
- One false positive: `placeholder` string at `coupon-section.tsx` line 128 is an HTML input placeholder attribute, not a code stub

---

### Human Verification Required

#### 1. Mini Cart Drawer Slide Animation and Scroll Lock

**Test:** Navigate to any page on the client app. Click the cart icon in the header.
**Expected:** Drawer slides in from the right edge with a 300ms CSS transition. Page overlay dims. Body scroll is locked while drawer is open. Clicking overlay or X button closes the drawer with reverse transition.
**Why human:** CSS `translate-x` transition, `document.body.style.overflow`, and animation timing cannot be verified statically.

#### 2. Coupon Code Application (Authenticated)

**Test:** Add items to cart, navigate to `/cart`, expand "Have a promo code?", enter a valid coupon code, click Apply.
**Expected:** Loading state shown during API call. On success: input clears, drawer collapses, green chip appears with code and X button, PriceSummary updates to show discount line and "You save" text.
**Why human:** Interactive form state transitions and server API round-trip required.

#### 3. Guest-to-Auth Cart Merge on Login

**Test:** Add 2+ items to cart as guest (not signed in). Sign in via Clerk. Observe cart state.
**Expected:** `useCartSync` fires POST `/api/cart/merge` sequentially then GET `/api/cart`. Merged server cart replaces local Zustand state. No items lost; quantities capped at available stock.
**Why human:** Requires live Clerk auth lifecycle and MongoDB cart state observation.

#### 4. Checkout Button Stock Gate

**Test:** Add an out-of-stock product to cart (requires inventory service returning `availableQty=0`), navigate to `/cart`.
**Expected:** Stock validation runs on mount, "Out of Stock" red badge appears next to item, "Proceed to Checkout" button is disabled (gray), message "Remove out-of-stock items to continue" appears below it.
**Why human:** Requires live inventory data from Prisma returning out-of-stock status.

---

### Commit Verification

All 10 commits from SUMMARY files confirmed in git log:

| Commit | Plan | Description |
|--------|------|-------------|
| `8ae0406` | 09-00 | Prisma coupon mock + cart fixtures |
| `f70b642` | 09-00 | Cart test stub files (45 it.todo) |
| `881846b` | 09-01 | Cart Zod schemas and CartService |
| `e665427` | 09-01 | CartController and cartRoutes |
| `aee4416` | 09-02 | Cart store coupon state + useCartSync hook |
| `feb37c8` | 09-02 | api.cart namespace + server route wiring |
| `54407cc` | 09-03 | CartItemRow and MiniCartDrawer |
| `f28a1f0` | 09-03 | CartHeaderButton wired into layout |
| `e984e9f` | 09-04 | CouponSection, PriceSummary, StockWarning |
| `396dca5` | 09-04 | Cart page Server Component + CartPageClient |

---

### Notable Implementation Decisions (Captured for Downstream Phases)

- **Zod schema format:** Cart schemas use nested `{ body: z.object({...}) }` format to match `validate` middleware; flat `*BodySchema` variants exported for controller-level parsing.
- **applyCoupon controller:** Server recomputes subtotal from cart items before calling `validateCoupon` — never trusts client-provided subtotal.
- **mergeGuestCart:** Silently skips items with `availableQty <= 0` rather than failing the whole merge. Guest doc is deleted after successful merge.
- **CartHeaderButton:** Mounts `useCartSync()` to ensure sync fires from the layout level, covering all pages.
- **Fire-and-forget sync:** CartPageClient mutations (updateQuantity, removeItem, clearCart) update Zustand optimistically, then call `api.cart.*` in background for auth users.

---

_Verified: 2026-03-14_
_Verifier: Claude (gsd-verifier)_
