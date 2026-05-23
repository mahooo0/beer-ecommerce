---
phase: 07-product-page
plan: 01
subsystem: api
tags: [product, cloudinary, typescript, mongodb, prisma, vitest]

# Dependency graph
requires:
  - phase: 06-category-filter
    provides: "Product service with filter/facet patterns for extending"
  - phase: 03-product-management
    provides: "ProductService class with getById, getBySlug, create patterns"
provides:
  - "GET /api/products/:id/related endpoint returning same-category or tag-overlap products"
  - "GET /api/products/:id/fbt endpoint with MongoDB aggregation and graceful empty fallback"
  - "ProductDetail, ProductVariantDetail, VariantOptionData types for client-side use"
  - "api.products.getRelated() and api.products.getFrequentlyBoughtTogether() client methods"
  - "Cloudinary remotePatterns in next.config.ts for next/image support"
  - "Wave 0 test stubs (42 todo tests) across 4 test files for PDPG-01..10 requirements"
affects: [07-02-product-gallery, 07-03-variant-selector, 07-04-product-specs, 07-05-reviews]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Related products query using OR across categoryId and tag overlap (Prisma)"
    - "FBT via MongoDB aggregation pipeline with minimum co-occurrence threshold of 2"
    - "Graceful degradation: FBT returns empty array on any aggregation error"
    - "it.todo() stubs for all requirement IDs to track pending behavior specs"

key-files:
  created:
    - apps/client/src/types/product-detail.ts
    - tests/products/product-page.test.ts
    - tests/products/variant-selector.test.ts
    - tests/products/product-service-related.test.ts
    - tests/products/product-service-fbt.test.ts
  modified:
    - apps/client/next.config.ts
    - apps/server/src/modules/product/product.service.ts
    - apps/server/src/modules/product/product.controller.ts
    - apps/server/src/modules/product/product.routes.ts
    - apps/client/src/lib/api.ts

key-decisions:
  - "Place /:id/related and /:id/fbt routes before /:id to prevent route shadowing in Express"
  - "FBT minimum co-occurrence threshold of 2 orders to avoid noise from single co-purchases"
  - "getRelated uses OR logic: same category OR overlapping tags to maximize relevance"
  - "Wrap FBT MongoDB aggregation in try/catch returning [] for graceful degradation"

patterns-established:
  - "ProductDetail extends base Product with full relation typing for client-side PDP"
  - "Controller methods parse optional limit query param with type-specific defaults"

requirements-completed: [PDPG-04, PDPG-05]

# Metrics
duration: 2.5min
completed: 2026-03-11
---

# Phase 07 Plan 01: Product Page Foundation Summary

**Two new server endpoints (related + FBT via MongoDB aggregation), ProductDetail TypeScript types, Cloudinary next/image config, and 42 Wave 0 test stubs covering all PDPG requirements**

## Performance

- **Duration:** ~2.5 min
- **Started:** 2026-03-11T15:41:34Z
- **Completed:** 2026-03-11T15:44:01Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Created `ProductDetail`, `ProductVariantDetail`, and `VariantOptionData` TypeScript types for full product page typing
- Implemented `getRelated` (same-category + tag overlap query via Prisma) and `getFrequentlyBoughtTogether` (MongoDB aggregation pipeline with graceful error fallback) in ProductService
- Registered two new public routes `GET /:id/related` and `GET /:id/fbt` in product.routes.ts before `/:id` to prevent shadowing
- Extended client `api.products` with `getRelated()` and `getFrequentlyBoughtTogether()` methods
- Added Cloudinary `remotePatterns` to next.config.ts enabling next/image for CDN images
- Created 4 test files with 42 `it.todo()` stubs covering PDPG-01 through PDPG-10 requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 test stubs + ProductDetail type + next.config Cloudinary fix** - `850eec1` (feat)
2. **Task 2: Server related/FBT endpoints + client API extensions** - `b5a1ee7` (feat)
3. **Task 2 fix: Syntax error in product.service.ts** - `d6a8bae` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/client/src/types/product-detail.ts` - ProductDetail, ProductVariantDetail, VariantOptionData types
- `apps/client/next.config.ts` - Added Cloudinary remotePatterns for next/image
- `apps/server/src/modules/product/product.service.ts` - Added getRelated() and getFrequentlyBoughtTogether() methods
- `apps/server/src/modules/product/product.controller.ts` - Added getRelated and getFbt controller methods
- `apps/server/src/modules/product/product.routes.ts` - Registered /:id/related and /:id/fbt routes
- `apps/client/src/lib/api.ts` - Extended products API with getRelated and getFrequentlyBoughtTogether
- `tests/products/product-page.test.ts` - PDPG-01,03,06,07,08,09,10 todo stubs (22 tests)
- `tests/products/variant-selector.test.ts` - PDPG-02 todo stubs (7 tests)
- `tests/products/product-service-related.test.ts` - getRelated todo stubs (6 tests)
- `tests/products/product-service-fbt.test.ts` - getFrequentlyBoughtTogether todo stubs (7 tests)

## Decisions Made
- Place `/:id/related` and `/:id/fbt` routes before `/:id` to prevent Express route shadowing
- FBT minimum co-occurrence threshold of 2 orders to filter noise from single co-purchases
- `getRelated` uses OR logic across categoryId and tag IDs to maximize product coverage
- `getFrequentlyBoughtTogether` wrapped in try/catch returning `[]` for graceful degradation when MongoDB is unavailable or has no order history

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed methods placed outside ProductService class body**
- **Found during:** Task 2 verification (test run)
- **Issue:** Edit pattern matched the wrong closing brace, causing `getRelated` and `getFrequentlyBoughtTogether` to be placed outside the class body — esbuild transform error
- **Fix:** Removed the extra `}` that prematurely closed the class before the new methods
- **Files modified:** apps/server/src/modules/product/product.service.ts
- **Verification:** `pnpm vitest run tests/products/product.service.test.ts` no longer shows transform error
- **Committed in:** d6a8bae (fix commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug fix)
**Impact on plan:** Auto-fix necessary for correctness. No scope creep.

## Issues Encountered
- esbuild transform error revealed the class body placement bug — caught and fixed immediately during verification

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ProductDetail type is ready for use in product page components (07-02+)
- Both server endpoints are registered and functional for client consumption
- Test stubs provide clear behavioral specs for all subsequent implementation tasks
- Cloudinary images will render correctly via next/image in gallery components

---
*Phase: 07-product-page*
*Completed: 2026-03-11*
