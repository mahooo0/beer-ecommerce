---
phase: 06-filter-system
plan: 01
subsystem: api
tags: [prisma, jsonb, postgres, filtering, facets, zod, vitest]

# Dependency graph
requires:
  - phase: 06-00
    provides: filter system research, test infrastructure stubs
  - phase: 04-01
    provides: category materialized path pattern
provides:
  - filterProducts method with JSONB attribute OR/AND query logic
  - getFacetCounts method with brand/attribute/availability aggregation
  - GET /api/products/filter public endpoint
  - GET /api/products/facets public endpoint
  - filterQuerySchema Zod schema for query validation
affects:
  - 06-02: client filter UI will consume these endpoints
  - 06-03: admin filter settings will use facet counts

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JSONB attribute filtering: path operator with OR within key groups, AND across key groups"
    - "Facet counting: Prisma groupBy for brands, app-level aggregation for JSONB attributes"
    - "vi.hoisted() + absolute path vi.mock() pattern for Vitest 4.x module mocking"

key-files:
  created:
    - tests/products/product.service.test.ts
  modified:
    - apps/server/src/modules/product/product.service.ts
    - apps/server/src/modules/product/product.controller.ts
    - apps/server/src/modules/product/product.routes.ts
    - apps/server/src/modules/product/product.schemas.ts
    - tests/setup.ts

key-decisions:
  - "Vitest 4.x requires vi.hoisted() for mock functions AND absolute paths in vi.mock() - aliases like @repo/db are not resolved in vi.mock()"
  - "Availability filter uses OR clauses: in_stock = variants.some.stock > 0, out_of_stock = variants.every.stock = 0"
  - "Attribute facets aggregated in application code (not SQL) to avoid complex JSONB aggregation queries"
  - "Brand facets use Prisma groupBy for efficiency, then name lookup in separate query"
  - "Filter and facets endpoints placed BEFORE /:id route to prevent route shadowing"

patterns-established:
  - "OR within same attribute key, AND across different attribute keys for multi-value JSONB filtering"
  - "getFacetCounts accepts currentFilters to enable future filter exclusion (e.g., brand counts exclude brand filter)"

requirements-completed:
  - FILT-01
  - FILT-03
  - FILT-05
  - FILT-07

# Metrics
duration: 13min
completed: 2026-03-11
---

# Phase 06 Plan 01: Server-Side Product Filter API Summary

**Prisma JSONB attribute filtering with OR/AND logic, brand/attribute/availability facet counts, and two new public API endpoints (GET /filter, GET /facets)**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-11T12:02:47Z
- **Completed:** 2026-03-11T12:15:44Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `filterProducts` method handles category path (materialized path startsWith), price range, brand OR filter, JSONB attribute OR-within-key/AND-across-keys logic, and availability via variant stock queries
- `getFacetCounts` method returns brand counts via groupBy, attribute value counts via app-level JSONB aggregation, and in_stock/out_of_stock availability counts
- Two public API endpoints registered: `GET /api/products/filter` and `GET /api/products/facets`
- 12 tests covering FILT-01 (category/JSONB), FILT-05 (OR/AND logic), FILT-07 (availability), and FILT-03 (facet counts) all pass
- Fixed Vitest 4.x test infrastructure: `vi.hoisted()` in setup.ts + absolute path module mocking

## Task Commits

Each task was committed atomically:

1. **Task 1: filterProducts method with JSONB queries and OR/AND logic** - `e8a2f91` (feat)
2. **Task 2: getFacetCounts endpoints and filter API routes** - `2c3aa19` (feat)

## Files Created/Modified

- `apps/server/src/modules/product/product.service.ts` - Added filterProducts and getFacetCounts methods with full filter logic
- `apps/server/src/modules/product/product.controller.ts` - Added filter() and facets() controller methods
- `apps/server/src/modules/product/product.routes.ts` - Registered GET /filter and GET /facets public routes
- `apps/server/src/modules/product/product.schemas.ts` - Added filterQuerySchema with Zod
- `tests/products/product.service.test.ts` - 12 tests for filter and facet behavior (converted from it.todo stubs)
- `tests/setup.ts` - Fixed global mock setup to use vi.hoisted() for Vitest 4.x compatibility

## Decisions Made

- Vitest 4.x breaking change: `vi.mock('@repo/db', ...)` with alias doesn't work - must use absolute resolved path `/path/to/packages/db/src/index.ts`
- `vi.hoisted()` required in setup.ts so vi.fn() inside mock factories creates proper Vitest spy functions
- Availability filter placed as OR clauses (not AND) so combining in_stock+out_of_stock doesn't zero out results
- Attribute facets computed in application code to avoid complex PostgreSQL JSONB aggregation syntax

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed Vitest 4.x module mock compatibility**
- **Found during:** Task 1 (test execution)
- **Issue:** `vi.mock('@repo/db', ...)` with alias not intercepting real module; `vi.fn()` inside `vi.mock()` factory not producing Vitest mock functions in Vitest 4.x
- **Fix:** Updated `tests/setup.ts` to use `vi.hoisted()` for all mock creation; used absolute filesystem path in `vi.mock()` calls in test file
- **Files modified:** tests/setup.ts, tests/products/product.service.test.ts
- **Verification:** All 12 filter tests pass; prismaMock functions verified as proper vi mock functions
- **Committed in:** e8a2f91 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking/infrastructure)
**Impact on plan:** Fix required to make any tests work. No scope creep.

## Issues Encountered

Pre-existing test failures in `tests/products/listing.test.ts`, `status.test.ts`, and `csv-import.test.ts` due to the same Vitest 4.x breaking change (they use `vi.mocked()` which doesn't work with non-hoisted mocks). These are out of scope - documented in deferred items.

## Next Phase Readiness

- Server-side filter API complete: `filterProducts` and `getFacetCounts` methods operational
- Client filter UI (06-02) can consume GET /api/products/filter and GET /api/products/facets
- All FILT-01, FILT-03, FILT-05, FILT-07 requirements satisfied

---
*Phase: 06-filter-system*
*Completed: 2026-03-11*

## Self-Check: PASSED

- FOUND: .planning/phases/06-filter-system/06-01-SUMMARY.md
- FOUND: tests/products/product.service.test.ts
- FOUND: apps/server/src/modules/product/product.service.ts (filterProducts + getFacetCounts)
- FOUND: commit e8a2f91 (Task 1)
- FOUND: commit 2c3aa19 (Task 2)
