---
phase: 06-filter-system
plan: 05
subsystem: filter-system
tags: [gap-closure, pre-order, availability-filter, price-range, prisma]
dependency_graph:
  requires: [06-01, 06-02, 06-04]
  provides: [FILT-07-complete, dynamic-price-range]
  affects: [apps/server, apps/client, packages/db]
tech_stack:
  added: []
  patterns: [dynamic-aggregation, three-state-availability]
key_files:
  created: []
  modified:
    - packages/db/prisma/schema.prisma
    - apps/server/src/modules/product/product.service.ts
    - apps/server/src/modules/product/product.schemas.ts
    - apps/client/src/components/filters/availability-filter.tsx
    - apps/client/src/components/filters/filter-content.tsx
    - apps/client/src/components/filters/active-filters.tsx
    - apps/client/src/app/categories/[slug]/page.tsx
    - tests/filters/availability-filter.test.tsx
decisions:
  - "[Phase 06-05]: Three mutually exclusive availability states: in_stock (has stock), out_of_stock (no stock AND allowPreorder=false), pre_order (no stock AND allowPreorder=true)"
  - "[Phase 06-05]: Dynamic priceRange derived from prisma.product.aggregate _min/_max price instead of hardcoded null"
metrics:
  duration: "4m"
  completed: "2026-03-11T13:00:01Z"
  tasks: 2
  files: 8
---

# Phase 06 Plan 05: Gap Closure - Pre-Order Availability and Dynamic Price Range Summary

**One-liner:** End-to-end pre-order availability filter with allowPreorder schema field, three-state facet counts, and dynamic priceRange aggregation replacing hardcoded null.

## What Was Built

This plan closed two verification gaps from Phase 06 VERIFICATION.md:

1. **FILT-07 Pre-Order Support (gap closure):** Added `allowPreorder Boolean @default(false)` to the Product model. Server `filterProducts` now handles a `pre_order` availability clause matching products with `allowPreorder=true` AND all variants at stock=0. The `getFacetCounts` method now returns three mutually exclusive availability counts: in_stock (any variant stock > 0), out_of_stock (all variants stock=0 AND allowPreorder=false), pre_order (all variants stock=0 AND allowPreorder=true). The client AvailabilityFilter renders a third "Pre-Order" checkbox, `active-filters.tsx` displays the label "Pre-Order", and the category page maps `pre_order` from the server facet array.

2. **Dynamic priceRange (anti-pattern fix):** Replaced the hardcoded `priceRange: null` in `getFacetCounts` with a `prisma.product.aggregate` query using `_min.price` and `_max.price`. The category page falls back to `{ min: 0, max: 999999 }` when the aggregation returns null (empty category).

## Tasks Completed

| # | Task | Commit | Files Modified |
|---|------|--------|----------------|
| 1 | Add pre-order schema field and server filter/facet support + dynamic priceRange | 96c7e09 | schema.prisma, product.service.ts, product.schemas.ts |
| 2 | Add pre-order option to client filter UI and update tests | d98975f | availability-filter.tsx, filter-content.tsx, active-filters.tsx, categories/[slug]/page.tsx, availability-filter.test.tsx |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- TypeScript: Server compiles without new errors in modified files (pre-existing errors in unrelated files remain)
- Tests: All 21 filter tests pass (4 test files: attribute, availability, price, filter-drawer)
- New tests added: 3 (renders Pre-Order checkbox, toggling pre_order updates filter state, shows pre-order count)

## Self-Check: PASSED

All key files exist on disk. Both task commits (96c7e09 and d98975f) verified in git log. All 21 filter tests pass.
