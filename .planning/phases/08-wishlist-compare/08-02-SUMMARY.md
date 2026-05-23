---
phase: 08-wishlist-compare
plan: "02"
subsystem: client-stores-ui
tags: [zustand, wishlist, compare, optimistic-updates, product-card]
dependency_graph:
  requires: ["08-00"]
  provides: ["wishlist-store", "compare-store", "wishlist-button", "compare-bar", "compare-checkbox"]
  affects: ["product-card", "08-03"]
tech_stack:
  added: []
  patterns: ["optimistic-update-with-rollback", "separate-client-islands", "sessionStorage-persist"]
key_files:
  created:
    - apps/client/src/stores/wishlist-store.ts
    - apps/client/src/stores/compare-store.ts
    - apps/client/src/components/product/wishlist-button.tsx
    - apps/client/src/components/product/compare-checkbox.tsx
    - apps/client/src/components/compare/compare-bar.tsx
  modified:
    - apps/client/src/components/product/product-card.tsx
decisions:
  - "Separate CompareCheckbox client component to avoid re-rendering full ProductCard grid on compare state change"
  - "WishlistButton reverts Zustand optimistic update on API failure for authenticated users only"
  - "CompareBar shows empty slot placeholders when fewer than 2 items selected to indicate minimum for compare"
metrics:
  duration: 124s
  completed_date: "2026-03-12"
  tasks: 2
  files: 6
---

# Phase 08 Plan 02: Client Stores and Product Card Overlays Summary

Zustand wishlist/compare stores with localStorage/sessionStorage persistence, WishlistButton with optimistic DB sync and rollback, CompareBar floating bottom panel, and CompareCheckbox as separate client islands on ProductCard.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wishlist and Compare Zustand stores | 1caa4d4 | wishlist-store.ts, compare-store.ts |
| 2 | WishlistButton, CompareBar, CompareCheckbox, ProductCard | 1654d84 | wishlist-button.tsx, compare-bar.tsx, compare-checkbox.tsx, product-card.tsx |

## Decisions Made

- **Separate client islands:** CompareCheckbox and WishlistButton are separate `'use client'` components, preventing the full ProductCard grid from re-rendering on every wishlist/compare state change.
- **Optimistic rollback pattern:** WishlistButton toggles Zustand immediately, then fires API in background for authenticated users. On failure, reverts by calling addItem (if remove failed) or removeItem (if add failed).
- **Guest users:** No API calls for unauthenticated users — localStorage-only is correct behavior per spec.
- **CompareBar empty slots:** Shows placeholder slots when fewer than 2 items selected to guide users toward the minimum requirement.
- **Hydration safety:** Both WishlistButton and CompareCheckbox use `mounted` state guard to render neutral/outline state during SSR, preventing hydration mismatch.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles without errors for new files (pre-existing errors in other files are unrelated)
- Wishlist store: localStorage persistence via `{ name: 'wishlist-storage' }`
- Compare store: sessionStorage persistence via `createJSONStorage(() => sessionStorage)`, max 4 enforced
- WishlistButton: outline heart until mounted, filled red when in wishlist, CSS transition on fill
- WishlistButton: POST /api/wishlist on add, DELETE /api/wishlist/:productId on remove for auth users
- WishlistButton: reverts Zustand state on API failure
- WishlistButton: no API call for guest users
- CompareCheckbox: disabled when isFull() and not already checked
- CompareBar: returns null when items.length === 0
- ProductCard: overlays appear on hover (desktop) and always visible (mobile via opacity-100)
