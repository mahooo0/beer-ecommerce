# Phase 8: Wishlist & Compare - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can save products to a wishlist and compare products side-by-side, with guest/auth support and price/stock change detection. Covers: wishlist CRUD (add/remove/view), guest localStorage + auth DB sync, compare selection and comparison page, and event hooks for price drop/restock detection. Actual email sending is deferred to Phase 17 (Notifications).

</domain>

<decisions>
## Implementation Decisions

### Wishlist Interaction
- Heart icon as top-right overlay on product cards (hover or always visible)
- Fill animation on toggle (outline to filled red/pink on add, reverse on remove) — no toast notification
- Heart + count badge in site header next to cart icon, linking to /wishlist
- On product detail page, wishlist toggle placed below product title (heart icon + "Add to Wishlist" text)

### Guest-to-Auth Sync
- Zustand + persist middleware for wishlist store (mirrors cart-store.ts pattern exactly)
- localStorage for guest users, DB API for authenticated users
- Silent merge on login — all local items added to DB wishlist, duplicates skipped
- Keep localStorage as read cache after sync (DB is source of truth, local provides optimistic UI)
- Optimistic updates for authenticated users — toggle heart immediately, sync to DB in background, revert on failure

### Compare Selection Flow
- "Compare" checkbox on product cards (appears on hover or always visible)
- Maximum 2-4 products selectable for comparison
- Floating sticky bar at bottom shows thumbnails of selected products, X to remove each, and "Compare (N)" button navigating to /compare
- Bar collapses/hides when no products are selected
- Compare page shows side-by-side specification table with differing cells highlighted via subtle background color (e.g., light yellow)
- Compare state persisted in sessionStorage (survives page navigation, clears on tab close) — no DB storage

### Price Drop & Restock Alerts
- Email-only notification delivery (integrates with Phase 17 via Resend)
- Per-item toggles for "Notify on price drop" and "Notify on restock" (both ON by default) — uses existing Prisma fields notifyOnPriceDrop and notifyOnRestock
- Build event detection hooks now (price change events, restock events via EventBus) — actual email sending deferred to Phase 17
- Any price decrease triggers notification (no minimum threshold)
- Wishlist page shows "Price dropped!" badge with savings amount when current price < price at time of adding
- WishlistItem should store priceAtAdd (snapshot of price when item was wishlisted) for comparison

### Claude's Discretion
- Compare checkbox exact styling and hover behavior on product cards
- Floating compare bar animation and responsive behavior on mobile
- Wishlist page layout details (grid vs list, sorting options)
- Empty state designs for wishlist and compare pages
- Restock detection mechanism (event listener on inventory changes)
- Error handling for sync failures and optimistic update rollbacks

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cart-store.ts` (Zustand + persist): Direct pattern to mirror for wishlist-store.ts
- `ProductCard` component: Needs heart overlay and compare checkbox additions
- `StarRating` component: Available for wishlist page product display
- `EventBus`: Existing event system for price change and restock event emission
- Wishlist & WishlistItem Prisma models: Already defined with userId, notifyOnPriceDrop, notifyOnRestock fields

### Established Patterns
- Zustand + persist for client-side state with localStorage (cart-store.ts)
- Server Components + client islands for page structure
- Tailwind CSS for all styling (no shadcn/ui)
- Controller/service/routes triad for server modules
- Optimistic UI with background sync
- Prices as integer cents with `formatPrice` helper

### Integration Points
- ProductCard (`apps/client/src/components/product/product-card.tsx`): Add heart overlay + compare checkbox
- Product detail page (`apps/client/src/app/products/[slug]/`): Add wishlist toggle below title
- Site header: Add heart icon with count badge
- Server: New wishlist module (controller/service/routes) + compare endpoint
- EventBus: Subscribe to product.updated and inventory.updated for price/stock change detection
- Prisma schema: WishlistItem may need `priceAtAdd` field for price change badge

</code_context>

<specifics>
## Specific Ideas

- Heart animation should feel like Instagram's heart — instant, satisfying, no extra UI noise
- Compare bar at bottom similar to electronics retailer sites (Best Buy, Newegg)
- Wishlist page should show price change badges prominently to drive purchase conversions
- Silent merge on login should be seamless — user shouldn't even notice it happened

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-wishlist-compare*
*Context gathered: 2026-03-11*
