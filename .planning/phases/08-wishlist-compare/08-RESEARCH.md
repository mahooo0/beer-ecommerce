# Phase 8: Wishlist & Compare - Research

**Researched:** 2026-03-11
**Domain:** Client-side state management, optimistic UI, Zustand 5, Next.js 16 / React 19, Express 5 server modules, Prisma CRUD, EventBus
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Wishlist Interaction**
- Heart icon as top-right overlay on product cards (hover or always visible)
- Fill animation on toggle (outline to filled red/pink on add, reverse on remove) — no toast notification
- Heart + count badge in site header next to cart icon, linking to /wishlist
- On product detail page, wishlist toggle placed below product title (heart icon + "Add to Wishlist" text)

**Guest-to-Auth Sync**
- Zustand + persist middleware for wishlist store (mirrors cart-store.ts pattern exactly)
- localStorage for guest users, DB API for authenticated users
- Silent merge on login — all local items added to DB wishlist, duplicates skipped
- Keep localStorage as read cache after sync (DB is source of truth, local provides optimistic UI)
- Optimistic updates for authenticated users — toggle heart immediately, sync to DB in background, revert on failure

**Compare Selection Flow**
- "Compare" checkbox on product cards (appears on hover or always visible)
- Maximum 2-4 products selectable for comparison
- Floating sticky bar at bottom shows thumbnails of selected products, X to remove each, and "Compare (N)" button navigating to /compare
- Bar collapses/hides when no products are selected
- Compare page shows side-by-side specification table with differing cells highlighted via subtle background color (e.g., light yellow)
- Compare state persisted in sessionStorage (survives page navigation, clears on tab close) — no DB storage

**Price Drop & Restock Alerts**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WISH-01 | User can add/remove products to wishlist from product card or product page | Zustand store + heart overlay pattern on ProductCard + toggle below title in ProductPageClient |
| WISH-02 | Wishlist persists in localStorage for guests and syncs to database on login | Zustand persist middleware (same as cart-store.ts), Clerk auth hook detects login, silent merge API call |
| WISH-03 | User can view wishlist page with product cards and quick-add-to-cart | New /wishlist route with Server Component, ProductCard grid, add-to-cart wiring |
| WISH-04 | User can select 2-4 products for side-by-side comparison | Compare Zustand store (sessionStorage), product card checkbox, floating compare bar |
| WISH-05 | Compare page shows specification table with differences highlighted | Reuse ProductSpecsTable logic, pivot to columnar layout, diff-highlight via bg-yellow-50 |
| WISH-06 | User receives price drop and back-in-stock notifications for wishlisted items | priceAtAdd schema migration, EventBus subscriptions for product.updated + inventory.stockUpdated |
</phase_requirements>

---

## Summary

Phase 8 builds on two distinct but related features: wishlist (user-scoped product saving) and product comparison (session-scoped side-by-side analysis). Both features are client-heavy but need server backing for authenticated users. The existing codebase provides almost every prerequisite: `cart-store.ts` is the direct model for `wishlist-store.ts`, `ProductCard` is ready to receive overlay elements, `ProductSpecsTable` provides the spec rendering logic to adapt for the compare view, and the `EventBus` already emits `product.updated` and `inventory.stockUpdated` events.

The largest architectural concern is the **Prisma schema gap**: the existing `WishlistItem` model lacks a `priceAtAdd` field required by the locked decisions for price-drop badges. This migration must be Wave 0 work before any service or UI code can use it. The second concern is the **guest-to-auth sync race**: the Zustand hydration lifecycle with Clerk's `useUser` hook must be handled carefully to avoid double-syncs or missed merges on login.

For comparison, no server storage is needed (sessionStorage only), which simplifies the architecture considerably. The compare store is a standalone Zustand store (without server sync) that persists to sessionStorage instead of localStorage — a small but important difference from the cart/wishlist pattern.

**Primary recommendation:** Mirror `cart-store.ts` exactly for wishlist, add `priceAtAdd` migration in Wave 0, wire EventBus listeners for price/restock events, and build compare as a pure client-side sessionStorage store.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0.0 | Wishlist and compare state management | Already in project, used for cart-store.ts — exact mirror pattern |
| zustand/middleware persist | bundled with zustand 5 | localStorage (wishlist guest) / sessionStorage (compare) persistence | Handles serialization, hydration, and storage key naming |
| @clerk/nextjs | ^7.0.2 | Detect auth state for guest-to-auth sync trigger | Already integrated, `useUser` hook used for sync detection |
| next 16 / React 19 | in project | Page routing, Server Components, client islands | Established in project |
| Prisma via @repo/db | 6.x | WishlistItem CRUD, priceAtAdd storage | All DB access goes through @repo/db package |
| zod ^3.25.0 | in project | Request validation schemas for wishlist routes | All server routes use validate() middleware with Zod |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS v4 | in project | All styling — heart animation, compare bar, diff highlighting | All UI; no shadcn/ui, no external component library |
| CSS transitions | native | Heart fill animation (outline → filled) | Tailwind transition + fill class toggle, no animation library needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sessionStorage via zustand persist | URL state (nuqs) | URL state is shareable but 2-4 product IDs in URL is viable; sessionStorage is simpler and decided |
| Zustand persist (localStorage) | React Query + server | React Query better for server-heavy state; wishlist is optimistic-first so Zustand wins |
| Custom heart SVG animation | Framer Motion | Framer Motion adds bundle weight; CSS transition on fill/stroke color is sufficient for Instagram-style feel |

**Installation:** No new packages required — all dependencies already present in the project.

---

## Architecture Patterns

### Recommended Project Structure
```
apps/client/src/
├── stores/
│   ├── cart-store.ts         # existing — reference model
│   ├── wishlist-store.ts     # NEW — mirrors cart-store.ts
│   └── compare-store.ts      # NEW — sessionStorage persist
├── components/
│   ├── product/
│   │   ├── product-card.tsx  # MODIFY — add heart overlay + compare checkbox
│   │   └── wishlist-button.tsx  # NEW — heart icon client component
│   ├── wishlist/
│   │   └── price-drop-badge.tsx  # NEW — "Price dropped! Save $X" badge
│   └── compare/
│       └── compare-bar.tsx   # NEW — sticky floating bar
├── app/
│   ├── wishlist/
│   │   └── page.tsx          # NEW — server component, fetches wishlist items
│   └── compare/
│       └── page.tsx          # NEW — client component, reads compare store
│
apps/server/src/modules/
└── wishlist/                 # NEW module
    ├── wishlist.service.ts
    ├── wishlist.controller.ts
    ├── wishlist.routes.ts
    └── wishlist.validation.ts
```

### Pattern 1: Wishlist Store (Mirror of cart-store.ts)
**What:** Zustand store with persist middleware, localStorage key `wishlist-storage`
**When to use:** All wishlist UI interactions; guest and authenticated flows both write here first

```typescript
// Source: apps/client/src/stores/cart-store.ts (project reference)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistItem {
  productId: string;
  priceAtAdd: number; // cents — snapshot for price-drop badge
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  clearItems: () => void;
  totalItems: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          if (state.items.find((i) => i.productId === item.productId)) return state;
          return { items: [...state.items, item] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      hasItem: (productId) => get().items.some((i) => i.productId === productId),
      clearItems: () => set({ items: [] }),
      totalItems: () => get().items.length,
    }),
    { name: 'wishlist-storage' },
  ),
);
```

### Pattern 2: Compare Store (sessionStorage Variant)
**What:** Zustand store with persist middleware using sessionStorage
**When to use:** Compare checkbox interactions; no server sync needed

```typescript
// sessionStorage persistence — compare state clears on tab close
export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'compare-storage',
      storage: createJSONStorage(() => sessionStorage), // key difference from wishlist
    },
  ),
);
```

### Pattern 3: Guest-to-Auth Silent Merge
**What:** On login detection (`useUser().isSignedIn` transitions to true), read localStorage items and POST to sync endpoint, then keep localStorage as optimistic cache
**When to use:** Triggered once per login event; idempotent — server skips duplicates via `@@unique([wishlistId, productId])`

```typescript
// Client hook pattern — detect login and trigger sync
import { useUser } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import { useWishlistStore } from '@/stores/wishlist-store';

export function useWishlistSync() {
  const { isSignedIn } = useUser();
  const items = useWishlistStore((s) => s.items);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (isSignedIn && !syncedRef.current && items.length > 0) {
      syncedRef.current = true;
      // Fire-and-forget sync — keep localStorage as cache
      fetch('/api/wishlist/sync', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }).catch(() => { /* silent — local state intact */ });
    }
  }, [isSignedIn, items]);
}
```

### Pattern 4: Optimistic Toggle for Authenticated Users
**What:** Update Zustand store immediately, send API call in background, revert on failure
**When to use:** Authenticated users toggling wishlist heart; avoids UI lag

```typescript
async function toggleWishlist(productId: string, price: number) {
  const isInWishlist = store.hasItem(productId);
  // 1. Optimistic update
  if (isInWishlist) {
    store.removeItem(productId);
  } else {
    store.addItem({ productId, priceAtAdd: price });
  }
  try {
    // 2. Background sync
    await fetch(isInWishlist ? `/api/wishlist/${productId}` : '/api/wishlist', {
      method: isInWishlist ? 'DELETE' : 'POST',
    });
  } catch {
    // 3. Revert on failure
    if (isInWishlist) {
      store.addItem({ productId, priceAtAdd: price });
    } else {
      store.removeItem(productId);
    }
  }
}
```

### Pattern 5: Server Module (Controller/Service/Routes triad)
**What:** Standard project module structure — all existing modules follow this pattern
**When to use:** All wishlist server endpoints

```typescript
// wishlist.routes.ts — follows shipping.routes.ts pattern exactly
import { requireAuth } from '../../common/middleware/auth.middleware.js';
const router = Router();

// Authenticated routes
router.get('/', requireAuth, (req, res, next) => wishlistController.getWishlist(req, res, next));
router.post('/', requireAuth, validate(addItemSchema), (req, res, next) => wishlistController.addItem(req, res, next));
router.delete('/:productId', requireAuth, (req, res, next) => wishlistController.removeItem(req, res, next));
router.post('/sync', requireAuth, validate(syncSchema), (req, res, next) => wishlistController.syncItems(req, res, next));
router.patch('/:productId/notify', requireAuth, validate(notifySchema), (req, res, next) => wishlistController.updateNotifyPrefs(req, res, next));
```

### Pattern 6: EventBus Subscriptions for Price/Restock Detection
**What:** Listen to existing `product.updated` and `inventory.stockUpdated` events, query wishlisted items, emit new domain events for Phase 17 to consume
**When to use:** Server startup — registers once, runs for lifetime of server process

```typescript
// New events to add to EventMap
'wishlist.priceDrop': { productId: string; oldPrice: number; newPrice: number; affectedUserIds: string[] };
'wishlist.restock': { productId: string; variantId: string; affectedUserIds: string[] };

// Listener registration (called at server startup)
eventBus.on('product.updated', async ({ productId }) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  // Compare product.price against WishlistItem.priceAtAdd
  // If price dropped: emit 'wishlist.priceDrop' for Phase 17
});

eventBus.on('inventory.stockUpdated', async ({ variantId }) => {
  // Check if variant went from 0 → > 0
  // Query WishlistItems for associated product where notifyOnRestock=true
  // emit 'wishlist.restock' for Phase 17
});
```

### Anti-Patterns to Avoid
- **Calling DB directly from client components:** All authenticated wishlist operations must go through the server API — Clerk JWT forwarded in Authorization header
- **Using DB-first state for guest users:** Guests have no userId — all guest state is localStorage only, never attempt API calls for unauthenticated users
- **Storing compare state in DB:** Decided as sessionStorage only — no server round-trip for compare selection
- **Blocking UI on API sync:** Always update Zustand store first (optimistic), sync in background, revert on error
- **Re-rendering entire product grid on wishlist toggle:** Heart button must be isolated as a client component to prevent full-grid re-render

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage serialization | Custom JSON encode/decode | zustand persist middleware | Handles hydration, SSR safety (no window access during SSR), storage key namespacing |
| Duplicate wishlist items | Manual deduplication | `@@unique([wishlistId, productId])` in Prisma schema | DB-level constraint; sync endpoint can use `upsert` or catch unique constraint errors |
| Clerk auth state detection | Custom JWT parsing | `useUser()` from @clerk/nextjs | Clerk hook manages session lifecycle, handles token refresh |
| sessionStorage access during SSR | `typeof window` guard | `createJSONStorage(() => sessionStorage)` in zustand persist | Zustand handles SSR hydration mismatch — store is hydrated client-side only |
| Spec diff highlighting | Complex text diff | Simple value equality comparison across products | Compare table values are primitives; `a !== b` is sufficient, no diff library needed |

---

## Common Pitfalls

### Pitfall 1: Zustand Hydration Mismatch (SSR)
**What goes wrong:** Server renders with empty store state, client hydrates with localStorage data — React throws hydration mismatch error or flashes empty state
**Why it happens:** Zustand persist reads `localStorage` only on the client; Next.js renders server-side with no access to localStorage
**How to avoid:** Use `useHydrated()` pattern or Zustand's built-in `onRehydrateStorage` callback; conditionally render wishlist count badge only after hydration
**Warning signs:** Console errors about hydration mismatch; wishlist count shows 0 then jumps to actual count on first render

```typescript
// Safe hydration check
const [hydrated, setHydrated] = useState(false);
useEffect(() => setHydrated(true), []);
if (!hydrated) return null; // or skeleton
```

### Pitfall 2: Double Sync on Login
**What goes wrong:** `useWishlistSync` hook triggers multiple API calls because `isSignedIn` change causes multiple re-renders
**Why it happens:** React StrictMode double-invokes effects; `useEffect` dependency array includes `items` which may also change
**How to avoid:** Use a `useRef` flag (`syncedRef`) that persists across re-renders; check `!syncedRef.current` before syncing; set to `true` before the fetch, not after
**Warning signs:** Network tab shows duplicate `/api/wishlist/sync` calls on login

### Pitfall 3: priceAtAdd Missing from Schema
**What goes wrong:** Price-drop badge logic has no baseline to compare against; entire WISH-06 feature cannot function
**Why it happens:** Existing `WishlistItem` Prisma model lacks `priceAtAdd` field — this is a schema gap that must be fixed before any code
**How to avoid:** Prisma migration in Wave 0 that adds `priceAtAdd Int @default(0)` to WishlistItem; regenerate Prisma client; update `@repo/types` WishlistItem interface
**Warning signs:** TypeScript errors on `wishlistItem.priceAtAdd` access; Prisma validation errors on create

### Pitfall 4: Compare Page Rendering Without Store Hydration
**What goes wrong:** User navigates to /compare directly; sessionStorage not yet hydrated; empty compare page renders
**Why it happens:** sessionStorage, like localStorage, is only available client-side
**How to avoid:** Compare page must be a client component (`'use client'`); show empty state with "No products selected for comparison — browse products to add" message when store is empty
**Warning signs:** /compare shows blank page or crashes on direct URL navigation

### Pitfall 5: Heart Button Causing Full ProductGrid Re-render
**What goes wrong:** Clicking heart icon re-renders all ProductCard instances in the grid, causing visible flicker
**Why it happens:** If WishlistButton is not isolated as its own client component and the parent grid subscribes to the full wishlist store, any state change re-renders all cards
**How to avoid:** Extract `<WishlistButton productId={...} />` as a separate client component that subscribes to `useWishlistStore` with a selector; ProductCard itself stays as a lean component
**Warning signs:** React DevTools profiler shows all ProductCard instances re-rendering on single heart toggle

### Pitfall 6: EventBus Listener Registered Multiple Times
**What goes wrong:** Server handles multiple requests and registers a new `product.updated` listener on each request; memory leak and duplicate notifications
**Why it happens:** EventBus listeners registered inside route handlers instead of at module initialization
**How to avoid:** Register EventBus listeners once at module initialization time (e.g., in wishlist.routes.ts export or a dedicated wishlist.events.ts called from server index)
**Warning signs:** Node.js MaxListenersExceededWarning in server logs; notification events fire N times where N = request count

---

## Code Examples

Verified patterns from project codebase:

### Cart Store Pattern (Direct Reference for Wishlist Store)
```typescript
// Source: apps/client/src/stores/cart-store.ts
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => { ... }),
      removeItem: (productId, variantId) => set((state) => ({ ... })),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: 'cart-storage' },
  ),
);
```

### EventBus Pattern (Direct Reference for Wishlist Listeners)
```typescript
// Source: apps/server/src/common/events/event-bus.ts
// Add to EventMap:
'wishlist.priceDrop': { productId: string; oldPrice: number; newPrice: number; affectedUserIds: string[] };
'wishlist.restock': { productId: string; affectedUserIds: string[] };

// Subscription pattern:
eventBus.on('product.updated', async ({ productId }) => {
  // query DB, compute diff, emit if price dropped
});
```

### Route Pattern (Direct Reference for Wishlist Routes)
```typescript
// Source: apps/server/src/modules/shipping/shipping.routes.ts
import { requireAuth } from '../../common/middleware/auth.middleware.js';
router.get('/', requireAuth, (req, res, next) => controller.method(req, res, next));
```

### Prisma Schema Migration (Wave 0)
```prisma
// packages/db/prisma/schema.prisma — add to WishlistItem model
model WishlistItem {
  id                 String   @id @default(cuid())
  wishlistId         String
  wishlist           Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  productId          String
  product            Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  addedAt            DateTime @default(now())
  priceAtAdd         Int      @default(0)  // NEW — cents snapshot for price-drop badge
  notifyOnPriceDrop  Boolean  @default(true)
  notifyOnRestock    Boolean  @default(true)

  @@unique([wishlistId, productId])
  @@index([wishlistId])
  @@index([productId])
  @@map("wishlist_items")
}
```

### Compare Table Diff Highlighting
```typescript
// Determine differing rows across compared products
function isDifferent(key: string, products: ProductDetail[]): boolean {
  const values = products.map((p) => String(p.attributes?.[key] ?? ''));
  return new Set(values).size > 1;
}

// In JSX — Tailwind class for highlighted cells
<td className={isDifferent(key, products) ? 'bg-yellow-50' : ''}>
  {String(product.attributes[key] ?? '—')}
</td>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand 4 `persist` with explicit `partialize` | Zustand 5 `persist` — same API, improved TypeScript inference | Zustand 5.0 (2024) | No API changes required; project already on v5 |
| `localStorage.getItem` manually | `createJSONStorage(() => sessionStorage)` for sessionStorage stores | Zustand middleware | Built-in; use for compare store |

**No deprecated patterns relevant to this phase.**

---

## Open Questions

1. **How to get authenticated user's existing DB wishlist items into Zustand on first load?**
   - What we know: Guest users read from localStorage; after sync, DB is source of truth
   - What's unclear: On page load for an already-authenticated user (no localStorage), should the wishlist page fetch from DB and populate the Zustand store, or always read from DB directly on the wishlist page?
   - Recommendation: Wishlist page (server component) fetches from DB and passes items as props; wishlist store is primarily for the heart-toggle UI state, not for the wishlist page display. Two sources of truth are acceptable here because the page re-fetches on navigation.

2. **Should `priceAtAdd` be stored in localStorage for guest items?**
   - What we know: Guest items have a price when added; `priceAtAdd` is required for price-drop badge
   - What's unclear: If guest adds item at $10.00, logs in 3 days later when price is $8.00 — is the badge shown immediately after sync?
   - Recommendation: Yes — include `priceAtAdd` in the localStorage WishlistItem shape; sync endpoint should write it to DB so the badge appears immediately on the wishlist page post-login.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (project standard, see tests/setup.ts) |
| Config file | vitest.config.ts (workspace root) |
| Quick run command | `pnpm vitest run tests/wishlist/` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WISH-01 | addItem / removeItem / hasItem in wishlist store | unit | `pnpm vitest run tests/wishlist/wishlist-store.test.ts` | Wave 0 |
| WISH-01 | Heart overlay renders on ProductCard | unit | `pnpm vitest run tests/wishlist/wishlist-button.test.ts` | Wave 0 |
| WISH-02 | Guest sync: POST /sync merges items, skips duplicates | unit | `pnpm vitest run tests/wishlist/wishlist-service.test.ts` | Wave 0 |
| WISH-02 | useWishlistSync hook fires once on login, not on re-renders | unit | `pnpm vitest run tests/wishlist/wishlist-sync.test.ts` | Wave 0 |
| WISH-03 | Wishlist page renders product cards for all wishlist items | unit | `pnpm vitest run tests/wishlist/wishlist-page.test.ts` | Wave 0 |
| WISH-04 | Compare store: max 4 items enforced, add/remove/clear | unit | `pnpm vitest run tests/compare/compare-store.test.ts` | Wave 0 |
| WISH-04 | CompareBar renders selected products, shows "Compare (N)" | unit | `pnpm vitest run tests/compare/compare-bar.test.ts` | Wave 0 |
| WISH-05 | Compare page highlights differing attribute cells | unit | `pnpm vitest run tests/compare/compare-page.test.ts` | Wave 0 |
| WISH-06 | EventBus listener: product.updated triggers priceDrop event when price decreases | unit | `pnpm vitest run tests/wishlist/wishlist-events.test.ts` | Wave 0 |
| WISH-06 | EventBus listener: inventory.stockUpdated triggers restock event when back in stock | unit | `pnpm vitest run tests/wishlist/wishlist-events.test.ts` | Wave 0 |
| WISH-06 | Wishlist page shows price-drop badge when currentPrice < priceAtAdd | unit | `pnpm vitest run tests/wishlist/price-drop-badge.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run tests/wishlist/ tests/compare/`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/wishlist/wishlist-store.test.ts` — covers WISH-01 (addItem, removeItem, hasItem, deduplication)
- [ ] `tests/wishlist/wishlist-button.test.ts` — covers WISH-01 (heart overlay render, toggle state)
- [ ] `tests/wishlist/wishlist-service.test.ts` — covers WISH-02 (getWishlist, addItem, removeItem, syncItems, updateNotifyPrefs)
- [ ] `tests/wishlist/wishlist-sync.test.ts` — covers WISH-02 (useWishlistSync hook, once-per-login guard)
- [ ] `tests/wishlist/wishlist-page.test.ts` — covers WISH-03 (page renders product cards, empty state)
- [ ] `tests/wishlist/wishlist-events.test.ts` — covers WISH-06 (priceDrop and restock event emission)
- [ ] `tests/wishlist/price-drop-badge.test.ts` — covers WISH-06 (badge renders when price < priceAtAdd)
- [ ] `tests/compare/compare-store.test.ts` — covers WISH-04 (add/remove/clear, max 4 enforcement)
- [ ] `tests/compare/compare-bar.test.ts` — covers WISH-04 (floating bar renders, collapse when empty)
- [ ] `tests/compare/compare-page.test.ts` — covers WISH-05 (side-by-side table, diff highlighting)
- [ ] `tests/fixtures/wishlist.fixtures.ts` — shared mock wishlist and wishlist-item fixtures
- [ ] Add `wishlist`, `wishlistItem` Prisma mocks to `tests/setup.ts` prismaMock object

---

## Sources

### Primary (HIGH confidence)
- Project codebase: `apps/client/src/stores/cart-store.ts` — direct pattern reference for wishlist-store.ts
- Project codebase: `apps/server/src/common/events/event-bus.ts` — EventMap and subscription pattern
- Project codebase: `apps/server/src/common/middleware/auth.middleware.ts` — requireAuth usage
- Project codebase: `apps/server/src/modules/shipping/shipping.routes.ts` — routes triad pattern
- Project codebase: `packages/db/prisma/schema.prisma` — existing Wishlist/WishlistItem models (confirmed priceAtAdd is missing)
- Project codebase: `packages/types/src/index.ts` — WishlistItem interface (confirmed priceAtAdd absent)
- Project codebase: `tests/setup.ts` — Vitest test infrastructure and prismaMock pattern
- Project codebase: `apps/client/src/app/layout.tsx` — header structure for heart badge placement
- Project codebase: `apps/client/src/app/products/[slug]/product-page-client.tsx` — product detail client island structure for wishlist toggle placement

### Secondary (MEDIUM confidence)
- Zustand 5 docs (zustand.docs.pmnd.rs): persist middleware API with `createJSONStorage` for sessionStorage confirmed stable in v5
- @clerk/nextjs 7.x: `useUser()` hook returns `{ isSignedIn, user }` — stable API for auth state detection

### Tertiary (LOW confidence)
- None — all critical findings verified against project codebase directly

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project, versions confirmed from package.json
- Architecture: HIGH — patterns directly copied from existing project modules (cart-store, shipping routes, EventBus)
- Pitfalls: HIGH — derived from actual code inspection (priceAtAdd gap confirmed in schema, hydration pattern confirmed needed from existing stores)
- Prisma schema gap: HIGH — confirmed by reading schema.prisma directly

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable domain, no fast-moving dependencies)
