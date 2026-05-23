---
phase: 08
plan: 04
subsystem: client-compare
tags: [compare, client, next.js, zustand, table]
dependency_graph:
  requires: ["08-02"]
  provides: ["/compare page", "ComparePageClient component"]
  affects: ["apps/client"]
tech_stack:
  added: []
  patterns: ["Server Component + Client Island", "Zustand sessionStorage store", "sticky table column", "diff highlighting"]
key_files:
  created:
    - apps/client/src/app/compare/page.tsx
    - apps/client/src/app/compare/compare-page-client.tsx
  modified: []
decisions:
  - "Fetch full product details by slug via existing api.products.getBySlug — slug already stored in compare store items"
  - "Union of all product attribute keys for comparison rows — handles heterogeneous product types"
  - "CategoryAttribute display names from first product's category.attributes — graceful fallback to key name"
  - "isFieldDifferent() for static rows (price, type, brand, category), isDifferent() for dynamic attribute rows"
metrics:
  duration: 3m
  completed_date: "2026-03-12"
  tasks_completed: 1
  files_created: 2
  files_modified: 0
---

# Phase 08 Plan 04: Compare Page with Diff Highlighting Summary

Compare page at /compare renders a side-by-side specification table for 2-4 products with bg-yellow-50 diff highlighting on differing rows, empty/minimum states, and mobile horizontal scroll with sticky attribute column.

## What Was Built

**Compare page entry point** (`apps/client/src/app/compare/page.tsx`): Next.js Server Component that exports `{ title: 'Compare Products' }` metadata and renders the `ComparePageClient` island.

**Compare page client** (`apps/client/src/app/compare/compare-page-client.tsx`): Full client-side compare table with:
- Reads `items` from `useCompareStore` (sessionStorage-persisted)
- On mount, fetches full product details with `Promise.all` via `api.products.getBySlug`
- Three states: loading skeleton, empty state (0 items), minimum check (< 2 items), and comparison table (>= 2 items)
- Unified attribute key union across all products for dynamic rows
- Static comparison rows: Price, Product Type, Brand, Category
- `isDifferent` helper applies `bg-yellow-50` to any row where values are not identical
- Remove button (X icon) per product calls `removeItem(product.id)` from store
- Responsive horizontal scroll with `overflow-x-auto` and sticky left column for attribute names

## Decisions Made

1. **Fetch by slug not ID** — `CompareItem` stores slug, and `api.products.getBySlug` already exists and includes category+attributes in the response.
2. **Union of attribute keys** — Iterates all product attribute objects to build the unified key list, so products with different attributes are fully represented.
3. **Display names from first product's category** — Category attributes are used for display name mapping; unknown keys fall back to capitalized key name.
4. **Per-row diff helpers** — `isDifferent` for attribute rows (uses product.attributes map lookup), `isFieldDifferent` for static string value arrays.

## Deviations from Plan

None — plan executed exactly as written. Used `api.products.getBySlug` (already available in `apps/client/src/lib/api.ts`) rather than adding a new `fetchProductById` helper, as slug is stored on `CompareItem` and the existing function returns category attributes.

## Self-Check

- [x] `apps/client/src/app/compare/page.tsx` — FOUND
- [x] `apps/client/src/app/compare/compare-page-client.tsx` — FOUND
- [x] Commit `0fbfaf0` — FOUND
- [x] TypeScript: no new errors in compare files
- [x] Tests: 18 stubs pass (all `.todo()` — expected)

## Self-Check: PASSED
