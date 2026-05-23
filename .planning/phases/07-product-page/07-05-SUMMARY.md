---
phase: 07-product-page
plan: 05
subsystem: ui
tags: [react, nextjs, tailwind, product-page, carousel, reviews]

# Dependency graph
requires:
  - phase: 07-01
    provides: product detail API endpoints (related, FBT) and cart store
  - phase: 04-05
    provides: ProductCard component and category structure

provides:
  - ProductSpecsTable: two-column attribute table from JSONB data with humanized labels
  - ReviewsPlaceholder: average rating display, rating distribution bars, review list
  - RelatedProductsCarousel: horizontal snap-scroll carousel reusing ProductCard with arrow nav
  - FrequentlyBoughtTogether: checkbox-based bundle section with dynamic total and cart integration

affects:
  - product-page-assembly (07-06 or similar)
  - any phase using product detail page layout

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server-safe components (no 'use client') for static data display (ProductSpecsTable, ReviewsPlaceholder)
    - Client components for interactive state (RelatedProductsCarousel, FrequentlyBoughtTogether)
    - CSS snap scrolling with overflow-x-auto for mobile-friendly carousels
    - Controlled Set state for multi-checkbox selection with dynamic price calculation

key-files:
  created:
    - apps/client/src/components/product/product-specs-table.tsx
    - apps/client/src/components/product/reviews-placeholder.tsx
    - apps/client/src/components/product/related-products-carousel.tsx
    - apps/client/src/components/product/frequently-bought-together.tsx

key-decisions:
  - "Server-safe (no 'use client') for ProductSpecsTable and ReviewsPlaceholder - pure display components with no interaction"
  - "CSS scroll-snap for carousel instead of a library - no new dependency, works natively"
  - "Arrow visibility controlled by scroll position tracking via onScroll handler"
  - "FBT uses Set<string> for checked IDs - O(1) lookup and clean toggle logic"

patterns-established:
  - "Pattern 1: humanizeKey() converts snake_case attribute names to Title Case when no categoryAttributes match"
  - "Pattern 2: scroll arrow buttons hidden on mobile (hidden md:flex) and visibility gated on canScrollLeft/canScrollRight state"
  - "Pattern 3: FBT total is currentProduct.price + sum of checked products, updates reactively"

requirements-completed:
  - PDPG-03
  - PDPG-04
  - PDPG-05
  - PDPG-06

# Metrics
duration: 2min
completed: 2026-03-11
---

# Phase 07 Plan 05: Specs, Reviews, Carousel & FBT Summary

**Four below-the-fold product page sections: specs table with humanized labels, reviews placeholder with rating distribution bars, related products snap-scroll carousel, and frequently-bought-together checkbox bundle with live price total**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-11T15:46:17Z
- **Completed:** 2026-03-11T15:47:52Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- ProductSpecsTable renders JSONB attributes as two-column table, humanizes keys when no category attribute match, skips null/empty values, hides entirely when no data
- ReviewsPlaceholder shows overall rating + StarRating, 5-star distribution bars (proportional width), first 3 reviews with details, empty state message
- RelatedProductsCarousel uses CSS snap scroll (no library), arrow buttons track scroll position to auto-hide, reuses existing ProductCard
- FrequentlyBoughtTogether integrates with useCartStore().addItem(), initializes all products checked, dynamically recalculates total price, hides when no FBT products

## Task Commits

1. **Task 1: ProductSpecsTable and ReviewsPlaceholder** - `ba2bfd9` (feat)
2. **Task 2: RelatedProductsCarousel and FrequentlyBoughtTogether** - `cbdf0fd` (feat)

## Files Created/Modified
- `apps/client/src/components/product/product-specs-table.tsx` - Two-column attribute table with humanized key fallback
- `apps/client/src/components/product/reviews-placeholder.tsx` - Rating overview with distribution bars and review list
- `apps/client/src/components/product/related-products-carousel.tsx` - Horizontal scroll ProductCard carousel with arrow navigation
- `apps/client/src/components/product/frequently-bought-together.tsx` - Checkbox bundle with cart integration and dynamic pricing

## Decisions Made
- Server-safe components for ProductSpecsTable and ReviewsPlaceholder (no 'use client') — pure display, no interactivity needed
- CSS snap scrolling for carousel — avoids adding a carousel library dependency
- Arrow buttons gated on scroll position tracking via onScroll to avoid showing arrows when not needed
- FBT uses Set<string> for checked IDs enabling O(1) toggle and clean filtering

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Pre-existing TypeScript errors in other files (profile actions, search, attribute-filter) were present before this plan and are out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All four below-fold components are ready for integration into the product detail page layout
- Components accept well-typed props matching existing ProductDetail and CartItem interfaces
- No blockers for next phase
