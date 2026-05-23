# Phase 9: Cart System - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Persistent shopping cart with guest/auth support, cart merging on login, coupon application, stock validation before checkout, and mini cart accessible from all pages. Covers: add/remove/update cart items, guest localStorage + auth MongoDB sync, cart merge strategy, coupon code application and validation, stock availability warnings, mini cart slide-out drawer, and full cart page with price breakdown.

</domain>

<decisions>
## Implementation Decisions

### Mini Cart
- Slide-out drawer from the right edge of the screen (full height, page dimmed behind)
- Triggered by clicking the cart icon in the header (click to open/close, no hover or auto-open)
- Each item shows: product thumbnail, name, selected variant info (e.g. "Size: M, Color: Red"), quantity stepper (+/- buttons), line total, and remove (trash) button
- Quantities are editable directly in the mini cart — no need to visit full cart page
- Footer shows subtotal and "Checkout" + "View Cart" buttons

### Cart Merge Strategy
- Sum quantities when a guest logs in and both carts have the same item (capped at available stock)
- Silent merge — no notification, no modal, no toast. User's cart just has all items. Matches wishlist sync pattern from Phase 8
- Guest cart document deleted from MongoDB after successful merge
- Authenticated users are DB-backed: Zustand as optimistic cache, MongoDB as source of truth (multi-device cart sync)

### Price & Tax Display
- Cart page shows: Subtotal (sum of line items), Discount line (if coupon applied, shows savings amount), Total (subtotal minus discount)
- Tax line shows "Calculated at checkout" — tax depends on shipping address which isn't known until checkout
- Shipping line shows "Calculated at checkout" — shipping rate API (Phase 13) consumed at checkout (Phase 10)
- Green "You save $X" indicator displayed when a coupon is applied, reinforcing the discount value

### Coupon UX
- Expandable section: "Have a promo code?" link that reveals text input + Apply button on click
- One coupon at a time — applying a new code replaces the previous one. Full stacking rules come in Phase 15
- Invalid/expired codes show inline error below input with specific reason (red text, red border): "Invalid code", "Code expired", "Minimum order $50 required"
- Successfully applied coupon shown as a removable pill/chip: "SAVE20 ✗" with X to remove
- Discount amount shown as a line in the order summary breakdown

### Stock Validation
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

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cart-store.ts` (Zustand + persist): Existing store with addItem/removeItem/updateQuantity/clearCart — needs extension for DB sync and coupon support
- `wishlist-store.ts` + `use-wishlist-sync.ts`: Direct pattern to mirror for cart DB sync (optimistic cache + background API calls)
- `CartModel` (Mongoose): Cart schema with items, couponCode, expiresAt, userId/sessionId — ready to use
- `Coupon` model (Prisma): Full coupon schema with discountType, conditions, limits, expiration — ready for validation
- `formatPrice` helper: Cents-to-dollar formatting used throughout client app
- `ProductCard` component: Reusable for cart item display patterns

### Established Patterns
- Zustand + persist middleware for client-side state with localStorage (cart-store, wishlist-store)
- Server Components + client islands for page structure
- Controller/service/routes triad for server modules
- Optimistic UI with background sync and rollback on failure (wishlist pattern)
- Prices as integer cents throughout (Stripe-compatible)
- Tailwind CSS for all styling (no shadcn/ui — custom drawer like Phase 6 mobile filter drawer)
- Custom slide-in drawer pattern from Phase 6 (FilterDrawer) — reusable for mini cart

### Integration Points
- Header (`apps/client/src/app/layout.tsx`): Cart icon link exists — needs mini cart drawer + badge
- Cart page route: `apps/client/src/app/cart/page.tsx` (to be created)
- Server: New cart module (controller/service/routes) at `/api/cart`
- API client: `api.cart` namespace to be added in `apps/client/src/lib/api.ts`
- Coupon validation: Server-side endpoint consuming Prisma Coupon model
- Inventory check: Consume existing inventory service for stock validation
- Event bus: `cart.updated` event for downstream consumption

</code_context>

<specifics>
## Specific Ideas

- Mini cart should feel like standard modern e-commerce (Shopify, Nike) — slide-out drawer pattern
- Silent merge mirrors the Phase 8 wishlist sync approach — seamless, user shouldn't notice
- Coupon chip pattern similar to discount code display on Shopify checkout
- "You save $X" creates a positive reinforcement loop for coupon users

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-cart-system*
*Context gathered: 2026-03-12*
