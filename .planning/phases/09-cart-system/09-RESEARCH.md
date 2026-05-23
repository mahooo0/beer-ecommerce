# Phase 9: Cart System - Research

**Researched:** 2026-03-14
**Domain:** Shopping cart state management, guest/auth duality, cart-merge, coupon validation, slide-out drawer UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Mini Cart**
- Slide-out drawer from the right edge of the screen (full height, page dimmed behind)
- Triggered by clicking the cart icon in the header (click to open/close, no hover or auto-open)
- Each item shows: product thumbnail, name, selected variant info (e.g. "Size: M, Color: Red"), quantity stepper (+/- buttons), line total, and remove (trash) button
- Quantities are editable directly in the mini cart — no need to visit full cart page
- Footer shows subtotal and "Checkout" + "View Cart" buttons

**Cart Merge Strategy**
- Sum quantities when a guest logs in and both carts have the same item (capped at available stock)
- Silent merge — no notification, no modal, no toast. User's cart just has all items. Matches wishlist sync pattern from Phase 8
- Guest cart document deleted from MongoDB after successful merge
- Authenticated users are DB-backed: Zustand as optimistic cache, MongoDB as source of truth (multi-device cart sync)

**Price & Tax Display**
- Cart page shows: Subtotal (sum of line items), Discount line (if coupon applied, shows savings amount), Total (subtotal minus discount)
- Tax line shows "Calculated at checkout"
- Shipping line shows "Calculated at checkout"
- Green "You save $X" indicator displayed when a coupon is applied

**Coupon UX**
- Expandable section: "Have a promo code?" link that reveals text input + Apply button on click
- One coupon at a time — applying a new code replaces the previous one. Full stacking rules come in Phase 15
- Invalid/expired codes show inline error below input with specific reason (red text, red border): "Invalid code", "Code expired", "Minimum order $50 required"
- Successfully applied coupon shown as a removable pill/chip: "SAVE20 ✗" with X to remove
- Discount amount shown as a line in the order summary breakdown

**Stock Validation**
- Cart validates stock availability and shows warnings for low/out-of-stock items
- Out-of-stock items visually flagged — user cannot proceed to checkout with out-of-stock items

### Claude's Discretion
- Mini cart drawer animation and transition style
- Cart page layout details (responsive breakpoints, item card sizing)
- Stock validation timing (on page load, on quantity change, or both)
- Empty cart state design
- Loading states and skeleton design
- Error handling for cart sync failures and optimistic update rollbacks
- Cart icon badge design (count vs item count)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CART-01 | User can add products to cart with selected variant and quantity | Existing `CartItem` type in `@repo/types`, `addItem` in `cart-store.ts`, `CartModel` in Mongoose — all ready; extend Zustand store to call server for auth users |
| CART-02 | Cart supports guest users (localStorage/cookie) and authenticated users (database) | Zustand `persist` gives localStorage guest cart; MongoDB `CartModel` with `userId`/`sessionId` discrimination supports both modes |
| CART-03 | Guest cart merges with authenticated cart on login | Mirror `useWishlistSync` pattern: on `isSignedIn`, POST local items to `/api/cart/merge`, server sums quantities capped by stock, deletes guest document |
| CART-04 | Cart persists across browser sessions | Zustand `persist` middleware with `name: 'cart-storage'` already achieves this for guests; MongoDB TTL index already set for auth cleanup |
| CART-05 | User can update quantity, remove items, and clear cart | `updateQuantity`, `removeItem`, `clearCart` exist in `cart-store.ts`; need server-side counterparts for auth users |
| CART-06 | Cart shows real-time price calculation (subtotal, tax estimate, shipping estimate) | Computed client-side from Zustand items (cents arithmetic); tax/shipping deferred "Calculated at checkout" per locked decision |
| CART-07 | User can apply coupon/promo codes with validation feedback | Server validates against Prisma `Coupon` model — check isActive, startsAt, expiresAt, usageLimit, minOrderAmount; return typed error reasons |
| CART-08 | Cart validates stock availability before checkout with warnings | Call inventory service (already built, Phase 14) per cart item to compare quantity vs reserved |
| CART-09 | Mini cart (slide-out/dropdown) accessible from header on all pages | Custom drawer following Phase 6 `FilterDrawer` pattern; replace `<a href="/cart">Cart</a>` link in `apps/client/src/app/layout.tsx` with `CartHeaderButton` client island |
</phase_requirements>

---

## Summary

Phase 9 builds on a well-prepared foundation. The `CartModel` (Mongoose), `CartItem` type (`@repo/types`), and a basic Zustand `cart-store.ts` already exist. The primary engineering work is threefold: (1) extend the Zustand store to carry coupon state and sync to MongoDB for authenticated users using the exact pattern established by `useWishlistSync`; (2) build a server-side cart module (service / controller / routes) that handles CRUD, merge, and coupon validation using the Prisma `Coupon` model; and (3) wire the mini cart drawer into the header using the `FilterDrawer` slide-in pattern from Phase 6.

The guest-to-auth merge is the most complex piece: it mirrors the wishlist sync approach but requires quantity summing capped by available stock (via the existing inventory service). The coupon validation logic reads the already-complete `Coupon` Prisma model and returns specific error messages, which the client renders inline. Stock validation is a straightforward call to the inventory service's read path — no new inventory mutations occur in this phase.

The UI follows established conventions: Tailwind CSS only, no shadcn/ui, Server Component pages with client islands for interactivity, optimistic updates with rollback on failure, and all monetary values in integer cents.

**Primary recommendation:** Extend `cart-store.ts` with coupon/sync state, build the cart server module mirroring wishlist module structure, implement `useCartSync` hook mirroring `useWishlistSync`, and build `MiniCartDrawer` mirroring `FilterDrawer`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | Installed (workspace) | Client cart state + persist | Already used for `cart-store`, `wishlist-store`, `compare-store` |
| zustand/middleware `persist` | Same | localStorage persistence for guest cart | Pattern established in Phase 6-8 |
| mongoose / `CartModel` | Installed (`@repo/db`) | Server-side cart document store | Schema fully defined with TTL, sparse indexes, pre-validate hook |
| prisma / `@repo/db` | Installed | Coupon model reads for validation | `Coupon` model complete with all needed fields |
| zod | Installed (server) | Request body validation | Used in `validate` middleware across all server modules |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@clerk/nextjs` `useUser` / `useAuth` | Installed | Detect sign-in state, get token for sync | Required in `useCartSync` hook |
| `formatPrice` helper | Existing in client | Cents-to-dollar display | Use everywhere a price is rendered |
| Inventory service (Phase 14) | Existing | Stock availability check | `GET /api/inventory/stock?variantId=X` pattern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Zustand cart store extension | React Context | Zustand is already the project standard — no reason to switch |
| MongoDB CartModel | Prisma PostgreSQL cart | Decision locked in Phase 1: orders and carts in MongoDB, products in PostgreSQL |
| Custom drawer | shadcn/ui Sheet | Project uses Tailwind v4 without shadcn config — must build custom |

**Installation:** No new packages needed. All dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
apps/server/src/modules/cart/
├── cart.service.ts        # CartService class — CRUD, merge, coupon validation
├── cart.controller.ts     # HTTP handlers
├── cart.routes.ts         # Express Router, mounted at /api/cart
└── cart.validation.ts     # Zod schemas for request bodies

apps/client/src/
├── stores/
│   └── cart-store.ts      # EXTEND: add coupon state, applyCoupon, removeCoupon, setDbSynced
├── hooks/
│   └── use-cart-sync.ts   # NEW: mirror of use-wishlist-sync.ts
├── components/
│   ├── cart/
│   │   ├── mini-cart-drawer.tsx    # Slide-out drawer (right edge)
│   │   ├── cart-item-row.tsx       # Item with thumbnail, variant, stepper, remove
│   │   ├── coupon-section.tsx      # Expandable promo code input
│   │   ├── price-summary.tsx       # Subtotal / Discount / Total lines
│   │   └── cart-header-button.tsx  # Cart icon with badge, opens drawer
│   └── ...
├── app/
│   └── cart/
│       └── page.tsx       # Full cart page (Server Component wrapper)
│       └── cart-page-client.tsx  # Client island for interactive cart
└── lib/
    └── api.ts             # EXTEND: add api.cart namespace
```

### Pattern 1: Zustand Store Extension

The existing `cart-store.ts` is a guest-only localStorage store. Extend it to carry coupon state and a DB-sync status flag. Do NOT replace it — extend in place.

**What:** Add `couponCode`, `discountAmount`, `applyCoupon`, `removeCoupon` to store interface.
**When to use:** All coupon state management, both guest and auth users.

```typescript
// Extending cart-store.ts — additional state and actions
interface CartStore {
  // ... existing fields ...
  couponCode: string | null;
  discountAmount: number; // cents
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  // Computed
  subtotal: () => number;
}
```

### Pattern 2: useCartSync Hook (mirrors useWishlistSync)

**What:** On `isSignedIn`, POST local guest items + coupon to `/api/cart/merge`, then fetch full server cart to overwrite local state.
**When to use:** Mount inside `CartHeaderButton` or a `CartSyncProvider` near root — same placement strategy as `useWishlistSync` inside `WishlistHeaderBadge`.

```typescript
// Source: mirrors apps/client/src/hooks/use-wishlist-sync.ts
'use client';
import { useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useCartStore } from '@/stores/cart-store';

export function useCartSync() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || syncedRef.current) return;
    syncedRef.current = true;

    const sync = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        if (items.length > 0) {
          // Fire-and-forget merge
          fetch('/api/cart/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ items, couponCode }),
          }).catch(() => {});
        }

        // Fetch authoritative server cart
        const res = await fetch('/api/cart', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Replace local store with server cart
          // useCartStore.setState({ items: data.items, couponCode: data.couponCode, ... })
        }
      } catch {
        // Silently fail — local state remains intact
      }
    };

    void sync();
  }, [isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps
}
```

### Pattern 3: Server Cart Module (mirrors Wishlist Module)

**What:** `CartService` class using `CartModel` (Mongoose) for all persistence. `CartController` handles HTTP. `CartRoutes` mounts at `/api/cart`.
**When to use:** All server-side cart operations.

```typescript
// cart.service.ts structure (mirrors wishlist.service.ts)
export class CartService {
  async getOrCreateCart(userId: string): Promise<ICart>
  async getGuestCart(sessionId: string): Promise<ICart | null>
  async addItem(userId: string, item: ICartItem): Promise<ICart>
  async updateQuantity(userId: string, productId: string, variantId: string | undefined, quantity: number): Promise<ICart>
  async removeItem(userId: string, productId: string, variantId: string | undefined): Promise<ICart>
  async clearCart(userId: string): Promise<void>
  async mergeGuestCart(userId: string, guestItems: ICartItem[], couponCode?: string): Promise<ICart>
  async validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult>
  async applyCoupon(userId: string, code: string, subtotal: number): Promise<ICart>
  async removeCoupon(userId: string): Promise<ICart>
  async validateStock(userId: string): Promise<StockValidationResult[]>
}
```

### Pattern 4: MiniCartDrawer (mirrors FilterDrawer)

**What:** Right-edge slide-out drawer, full height, overlay dims page. Triggered by click on cart icon.
**When to use:** All pages via header.

```typescript
// Source: mirrors apps/client/src/components/filters/filter-drawer.tsx
// Key differences from FilterDrawer:
// - Positioned inset-y-0 RIGHT-0 (not left-0)
// - No "Apply" button — mutations happen immediately (no pending state needed)
// - Contains CartItemRow list + PriceSummary + footer CTAs
'use client';
export function MiniCartDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <CartHeaderButton onClick={() => setOpen(true)} />
      {open && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          {/* Drawer — right edge */}
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white flex flex-col"
            role="dialog" aria-modal="true" aria-label="Shopping cart">
            {/* header, scrollable items, footer */}
          </div>
        </>
      )}
    </>
  );
}
```

### Pattern 5: Cart Merge Algorithm

The merge runs server-side in `CartService.mergeGuestCart`. Key rules from locked decisions:

```
For each guest item:
  Find matching item in auth cart (productId + variantId)
  If match found:
    newQty = Math.min(authItem.quantity + guestItem.quantity, availableStock)
    Update auth cart item quantity
  Else:
    availableStock = inventory check
    cappedQty = Math.min(guestItem.quantity, availableStock)
    If cappedQty > 0: push guest item to auth cart

After merge:
  Delete guest cart document (CartModel.deleteOne({ sessionId }))
  Save auth cart
```

### Pattern 6: Coupon Validation

Server validates against Prisma `Coupon` model. Return typed reasons for client to render specific messages.

```typescript
interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount?: number; // cents
  errorReason?: 'INVALID_CODE' | 'CODE_EXPIRED' | 'MINIMUM_ORDER' | 'USAGE_LIMIT' | 'NOT_STARTED';
  errorMessage?: string; // human-readable: "Minimum order $50 required"
}

async validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) return { valid: false, errorReason: 'INVALID_CODE', errorMessage: 'Invalid code' };
  const now = new Date();
  if (now < coupon.startsAt) return { valid: false, errorReason: 'NOT_STARTED', errorMessage: 'Invalid code' };
  if (coupon.expiresAt && now > coupon.expiresAt) return { valid: false, errorReason: 'CODE_EXPIRED', errorMessage: 'Code expired' };
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return { valid: false, errorReason: 'USAGE_LIMIT', errorMessage: 'Code no longer available' };
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    const minFormatted = formatCents(coupon.minOrderAmount);
    return { valid: false, errorReason: 'MINIMUM_ORDER', errorMessage: `Minimum order ${minFormatted} required` };
  }
  const discountAmount = computeDiscount(coupon, subtotal);
  return { valid: true, coupon, discountAmount };
}
```

### Anti-Patterns to Avoid

- **Storing price in cart from client input:** Always use `price` from the product/variant record at add-to-cart time, stored in the cart document as a snapshot. Never trust client-provided prices.
- **Trusting client subtotal for coupon minimum check:** Server always recomputes subtotal from cart items before applying coupon.
- **Using session cookies for guest cart on the server:** Guest cart is purely client-side Zustand + localStorage. Server only gets guest items during the merge POST. No session management needed.
- **Importing from `@repo/db` in client-side files:** `CartModel` and `prisma` are server-only. Client uses `api.cart.*` functions.
- **Skipping MongoDB index use:** Always query carts by `userId` or `sessionId` (both have sparse indexes). Never scan full collection.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage persistence | Custom localStorage read/write | Zustand `persist` middleware | Handles hydration, SSR safety, and serialization edge cases |
| Slide-out drawer | Custom portal/modal manager | Extend `FilterDrawer` pattern | Phase 6 solved body scroll lock, z-index stacking, overlay; copy pattern directly |
| Cart document TTL cleanup | Cron job or scheduled task | MongoDB TTL index (`expireAfterSeconds: 0` on `expiresAt`) | Already configured in `CartSchema`; zero additional code needed |
| Coupon discount math | Custom formula | Prisma `Coupon.discountType` branch: PERCENTAGE vs FIXED_AMOUNT | Types already defined; branch on enum, not magic strings |
| Stock quantity check | Custom SQL | Inventory service already built (Phase 14) | `available(item) = quantity - reserved` helper already exists |

**Key insight:** The majority of complex problems in this phase are already solved — MongoDB schema, Zustand store skeleton, Prisma Coupon model, inventory service, drawer pattern. The work is integration, not invention.

---

## Common Pitfalls

### Pitfall 1: Hydration Mismatch on Cart Badge Count

**What goes wrong:** Server renders "0" (no localStorage access), client hydrates with real count — React throws hydration error or shows a flash.
**Why it happens:** Zustand `persist` reads localStorage only on the client; server renders with initial state.
**How to avoid:** Follow the `WishlistHeaderBadge` pattern — render `0` until `mounted` state is true. Use a `useEffect` + `useState` mounted guard before showing real count.
**Warning signs:** Console errors about "Text content did not match", badge flashing from 0 to real count.

### Pitfall 2: Infinite Re-render in useCartSync

**What goes wrong:** The sync `useEffect` includes `items` in the dependency array, causing it to re-run every time a cart item changes.
**Why it happens:** `items` is a new array reference on every render.
**How to avoid:** Mirror `useWishlistSync` exactly — use a `syncedRef = useRef(false)` gate, and only include `isSignedIn` in the dependency array. The ref prevents re-running after initial sync.

### Pitfall 3: Race Condition During Merge + Fetch

**What goes wrong:** `mergeGuestCart` fires (fire-and-forget) while `fetchServerCart` runs in parallel. Cart fetched before merge completes has stale data.
**Why it happens:** Both network calls are fired without awaiting the merge first.
**How to avoid:** In `useCartSync`, `await` the merge before fetching the authoritative cart, OR structure as sequential: POST merge, then GET cart. Fire-and-forget is acceptable only if the subsequent GET is guaranteed to happen after merge completes. Use `async/await` sequentially.

### Pitfall 4: Quantity Stepper Goes Below 1 or Exceeds Stock

**What goes wrong:** User taps minus button past 1 (negative quantities), or plus button past available stock.
**Why it happens:** Missing clamp logic in quantity stepper UI.
**How to avoid:** Clamp quantity: `Math.max(1, Math.min(newQty, availableStock))`. Disable minus button at 1, disable plus button at max stock. Mirror `WeightedQuantitySelector` clamp pattern from Phase 7.

### Pitfall 5: Coupon Applied to Wrong Subtotal

**What goes wrong:** Client sends subtotal to server for validation; client subtotal may differ from server-computed subtotal due to price updates.
**Why it happens:** Prices are snapshots in cart items but products may have been updated since add-to-cart.
**How to avoid:** Server computes subtotal from `sum(item.price * item.quantity)` directly from the stored cart document — never accepts subtotal as a request parameter. The locked decision to store `price` as a snapshot at add-to-cart time makes this straightforward.

### Pitfall 6: Out-of-Stock Item Blocking Checkout Without Clear UI

**What goes wrong:** User reaches checkout only to be blocked with a generic error; they don't know which item is the problem.
**Why it happens:** Stock validation happens too late (only at checkout).
**How to avoid:** Validate stock on cart page load AND on quantity change. Show individual item-level warnings (red badge "Out of stock", yellow badge "Only 2 left") inline on each cart item row. Disable "Proceed to Checkout" button if any item is out of stock. Per locked decision, stock validation is Claude's discretion on timing — validate on both page load and quantity change.

### Pitfall 7: Guest Cart Not Deleted After Merge

**What goes wrong:** Orphaned guest cart documents accumulate in MongoDB; same guest items appear again on next login if sessionId matches.
**Why it happens:** Merge logic adds to auth cart but forgets to delete guest cart.
**How to avoid:** `CartModel.deleteOne({ sessionId })` as the final step of `mergeGuestCart`, only after the auth cart has been saved successfully. Wrap in a try/catch to not fail the merge if cleanup fails.

---

## Code Examples

### CartItem Type (already in @repo/types)

```typescript
// Source: packages/types/src/index.ts
export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number; // cents
  quantity: number;
  imageUrl: string;
  sku: string;
  attributes?: Record<string, string>;
}
```

### CartModel Indexes (already in packages/db/src/mongoose.ts)

```typescript
// Source: packages/db/src/mongoose.ts
CartSchema.index({ userId: 1 }, { sparse: true });
CartSchema.index({ sessionId: 1 }, { sparse: true });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-cleanup
// Pre-validate hook: must have userId OR sessionId
```

### Event Bus — cart.updated event to add

```typescript
// Source: apps/server/src/common/events/event-bus.ts (extend EventMap)
type EventMap = {
  // ... existing events ...
  'cart.updated': { cartId: string; userId?: string; sessionId?: string; itemCount: number };
};
```

### Coupon Model Fields (Prisma schema)

```typescript
// Source: packages/db/prisma/schema.prisma
// model Coupon
discountType: DiscountType        // PERCENTAGE | FIXED_AMOUNT | FREE_SHIPPING
discountValue: Int                // percentage as whole number OR cents
minOrderAmount: Int?              // cents minimum cart total
maxDiscountAmount: Int?           // cents cap on percentage discounts
usageLimit: Int?                  // null = unlimited
usageCount: Int                   // incremented on successful apply
perCustomerLimit: Int             // default 1
applicableProductIds: String[]    // empty = all products
applicableCategoryIds: String[]   // empty = all categories
startsAt: DateTime
expiresAt: DateTime?
isActive: Boolean
```

### Server Cart Routes (to mount in apps/server/src/index.ts)

```typescript
// Pattern: identical to wishlist mounting
import { cartRoutes } from './modules/cart/cart.routes.js';
// ...
app.use('/api/cart', cartRoutes);
// In start(): registerCartEventListeners() if needed
```

### API Client Extension (apps/client/src/lib/api.ts)

```typescript
// Add to api object:
cart: {
  get: (token: string) =>
    fetcher<ApiResponse<Cart>>('/cart', { headers: { Authorization: `Bearer ${token}` } }),
  addItem: (item: CartItem, token: string) =>
    fetcher<ApiResponse<Cart>>('/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }),
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number, token: string) =>
    fetcher<ApiResponse<Cart>>('/cart/items', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, variantId, quantity }),
    }),
  removeItem: (productId: string, variantId: string | undefined, token: string) =>
    fetcher<ApiResponse<Cart>>(`/cart/items`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, variantId }),
    }),
  clear: (token: string) =>
    fetcher<ApiResponse<void>>('/cart', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
  merge: (items: CartItem[], couponCode: string | null, token: string) =>
    fetcher<ApiResponse<Cart>>('/cart/merge', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, couponCode }),
    }),
  validateCoupon: (code: string, subtotal: number, token: string) =>
    fetcher<ApiResponse<{ discountAmount: number; coupon: Coupon }>>('/cart/coupon/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    }),
  applyCoupon: (code: string, token: string) =>
    fetcher<ApiResponse<Cart>>('/cart/coupon', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }),
  removeCoupon: (token: string) =>
    fetcher<ApiResponse<Cart>>('/cart/coupon', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
  validateStock: (token: string) =>
    fetcher<ApiResponse<StockValidationResult[]>>('/cart/stock-validation', {
      headers: { Authorization: `Bearer ${token}` },
    }),
},
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cookie-based server session cart | Client Zustand + MongoDB sync | Industry shift ~2020 | No server session dependency, works with CDN edge |
| Per-request stock check | Optimistic UI + background validation | Standard for SPAs | Faster perceived UX; validate on key events |
| Storing cart in Redis only | MongoDB with TTL index | Established pattern | Simplifies ops; no separate Redis dependency for cart |

**Note:** This project uses MongoDB (not Redis) for cart storage per Phase 1 schema decisions. The TTL index on `expiresAt` handles automatic guest cart cleanup — no cron job needed.

---

## Open Questions

1. **Auth users: when to update MongoDB on each cart mutation**
   - What we know: Wishlist uses fire-and-forget background API calls; cart mutations (add/remove/update) may need faster server confirmation for multi-device sync
   - What's unclear: Should every quantity stepper click fire an API call, or debounce?
   - Recommendation: Debounce quantity changes (300–500ms delay before firing API) to avoid hammering server on rapid +/- clicks. Add/remove should fire immediately. This is Claude's discretion.

2. **Coupon per-customer limit enforcement**
   - What we know: `Coupon.perCustomerLimit` is in the schema (default 1), but there is no per-customer usage tracking table in the current schema
   - What's unclear: Is there an `OrderCoupon` or per-user coupon usage table in Prisma schema?
   - Recommendation: For Phase 9, skip per-customer limit enforcement (Phase 15 Promotions will handle full coupon rules). Validate only: isActive, dates, global usageLimit, and minOrderAmount.

3. **Cart page route: Server vs Client Component**
   - What we know: Product page uses Server Component + client island pattern
   - What's unclear: Cart has no server-fetchable user-specific data without auth token (no RSC-friendly auth pattern established)
   - Recommendation: Make cart page a thin Server Component wrapper (metadata only) with a `CartPageClient` client island that reads from Zustand store directly — same pattern as `WishlistPageClient`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (workspace root `vitest.config.ts`) |
| Config file | `/Users/muhemmedibrahimov/work/ecom-template/vitest.config.ts` |
| Quick run command | `npx vitest run tests/cart/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CART-01 | Add item to cart with variant/qty | unit | `npx vitest run tests/cart/cart-service.test.ts` | Wave 0 |
| CART-02 | Guest (localStorage) vs auth (MongoDB) mode | unit | `npx vitest run tests/cart/cart-store.test.ts` | Wave 0 |
| CART-03 | Guest cart merge on login with quantity sum + stock cap | unit | `npx vitest run tests/cart/cart-service.test.ts` | Wave 0 |
| CART-04 | Cart persists across sessions (localStorage via persist) | unit | `npx vitest run tests/cart/cart-store.test.ts` | Wave 0 |
| CART-05 | Update quantity, remove item, clear cart | unit | `npx vitest run tests/cart/cart-service.test.ts` | Wave 0 |
| CART-06 | Subtotal / discount / total computation | unit | `npx vitest run tests/cart/cart-store.test.ts` | Wave 0 |
| CART-07 | Coupon validation — all error paths + success | unit | `npx vitest run tests/cart/coupon-validation.test.ts` | Wave 0 |
| CART-08 | Stock validation returns per-item warnings | unit | `npx vitest run tests/cart/stock-validation.test.ts` | Wave 0 |
| CART-09 | MiniCartDrawer renders/opens/closes | unit | `npx vitest run tests/cart/mini-cart-drawer.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/cart/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/cart/cart-service.test.ts` — covers CART-01, CART-03, CART-05 (server service unit tests)
- [ ] `tests/cart/cart-store.test.ts` — covers CART-02, CART-04, CART-06 (Zustand store unit tests)
- [ ] `tests/cart/coupon-validation.test.ts` — covers CART-07 (all coupon error reasons + discount calculation)
- [ ] `tests/cart/stock-validation.test.ts` — covers CART-08 (stock check per cart item)
- [ ] `tests/cart/mini-cart-drawer.test.ts` — covers CART-09 (drawer open/close, item rendering)
- [ ] Add `coupon` mock to `tests/setup.ts` prismaMock (needed for coupon validation tests)

---

## Sources

### Primary (HIGH confidence)

- Codebase: `packages/db/src/mongoose.ts` — CartModel schema, TTL index, pre-validate hook confirmed
- Codebase: `packages/db/prisma/schema.prisma` — Coupon model fields confirmed
- Codebase: `packages/types/src/index.ts` — CartItem and Cart types confirmed
- Codebase: `apps/client/src/stores/cart-store.ts` — existing Zustand store confirmed
- Codebase: `apps/client/src/hooks/use-wishlist-sync.ts` — sync pattern to mirror confirmed
- Codebase: `apps/client/src/components/filters/filter-drawer.tsx` — drawer pattern to mirror confirmed
- Codebase: `apps/server/src/modules/wishlist/*` — server module structure to mirror confirmed
- Codebase: `apps/server/src/index.ts` — route mounting pattern confirmed
- Codebase: `apps/server/src/common/events/event-bus.ts` — EventMap extension point confirmed

### Secondary (MEDIUM confidence)

- Phase 9 CONTEXT.md — locked decisions (user decisions, not independently verified, but authoritative for this project)

### Tertiary (LOW confidence)

- None — all critical claims verified from codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from installed packages and existing imports
- Architecture: HIGH — verified from existing modules (wishlist, filter drawer) that serve as direct templates
- Pitfalls: HIGH — derived from Phase 6-8 accumulated decisions in STATE.md and code patterns observed
- Validation architecture: HIGH — vitest.config.ts verified, test directory structure confirmed

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable patterns, no external API dependencies)
