---
phase: 08-wishlist-compare
plan: "05"
subsystem: wishlist-events
tags: [events, event-bus, wishlist, notifications, price-drop, restock]
dependency_graph:
  requires: ["08-01", "08-03"]
  provides: ["wishlist.priceDrop event", "wishlist.restock event"]
  affects: ["Phase 17 Notifications"]
tech_stack:
  added: []
  patterns: ["EventBus listener registration", "Domain event emission", "Error-resilient async listeners"]
key_files:
  created:
    - apps/server/src/modules/wishlist/wishlist.events.ts
  modified:
    - apps/server/src/common/events/event-bus.ts
    - apps/server/src/index.ts
decisions:
  - "priceAtAdd updated after price drop emission to prevent duplicate notifications on subsequent product.updated events"
  - "Restock emits on any available > 0 stock update — Phase 17 deduplicates if needed"
  - "Listeners registered once in start() after routes, before app.listen() to avoid MaxListenersExceeded"
metrics:
  duration: 83s
  completed: "2026-03-12"
  tasks: 2
  files: 3
---

# Phase 08 Plan 05: Wishlist EventBus Listeners Summary

EventBus listeners for price drop and restock detection on wishlisted items, emitting domain events for Phase 17 Notifications to consume.

## What Was Built

**wishlist.events.ts** — `registerWishlistEventListeners()` registers two EventBus listeners:

1. **Price drop listener** (`product.updated`): Queries WishlistItems where `notifyOnPriceDrop=true` AND `priceAtAdd > currentPrice`. Emits `wishlist.priceDrop` with affected user IDs and old/new prices. Updates `priceAtAdd` to current price after emitting to prevent duplicate notifications.

2. **Restock listener** (`inventory.stockUpdated`): Triggers when `available > 0`. Finds the product via `productVariant`, then queries WishlistItems where `notifyOnRestock=true`. Emits `wishlist.restock` with affected user IDs.

Both listeners are wrapped in try/catch for error resilience — failures log but do not crash the server.

**event-bus.ts** — Two new event types added to `EventMap`:
- `wishlist.priceDrop: { productId, oldPrice, newPrice, affectedUserIds }`
- `wishlist.restock: { productId, affectedUserIds }`

**index.ts** — `registerWishlistEventListeners()` called once in `start()` after route mounting, before `app.listen()`.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | a7b50fb | feat(08-05): add wishlist price drop and restock event listeners |
| 2 | 0312c58 | feat(08-05): register wishlist event listeners at server startup |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `items[0].priceAtAdd` possibly undefined**
- **Found during:** Task 1 TypeScript compile
- **Issue:** `items[0]` could be undefined in strict TS even though `items.length > 0` guard was present
- **Fix:** Changed to `items[0]?.priceAtAdd ?? 0` for safe access
- **Files modified:** apps/server/src/modules/wishlist/wishlist.events.ts
- **Commit:** a7b50fb

## Self-Check: PASSED

- [x] apps/server/src/modules/wishlist/wishlist.events.ts — created
- [x] apps/server/src/common/events/event-bus.ts — wishlist.priceDrop and wishlist.restock in EventMap
- [x] apps/server/src/index.ts — registerWishlistEventListeners() called at startup
- [x] Commits a7b50fb and 0312c58 exist
