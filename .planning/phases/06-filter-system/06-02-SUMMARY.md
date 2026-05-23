---
phase: 06-filter-system
plan: 02
subsystem: ui
tags: [nuqs, use-debounce, react, nextjs, filters, url-state, tailwind]

# Dependency graph
requires:
  - phase: 06-00
    provides: filter system research and type definitions

provides:
  - useFilters hook with 8 URL-persisted filter params via nuqs
  - PriceFilter component with dual-handle range slider and debounced inputs
  - AttributeFilter component handling SELECT/RANGE/BOOLEAN attribute types
  - AvailabilityFilter component with in-stock/out-of-stock checkboxes
  - ActiveFilters component with removable badge chips and clear all
affects:
  - 06-03 (filter panel/sidebar will import these components)
  - 06-04 (server-side filtering uses same URL param names)

# Tech tracking
tech-stack:
  added:
    - nuqs@2.8.9 (URL state management with type-safe parsers)
    - use-debounce@10.1.0 (debounced callback for price slider)
  patterns:
    - vi.hoisted() for mock variables in vi.mock factories
    - URL-first filter state (no local state for filter values)
    - data-testid attributes on all interactive filter elements
    - Custom Tailwind slider implementation (no shadcn/ui dependency)

key-files:
  created:
    - apps/client/src/hooks/use-filters.ts
    - apps/client/src/components/filters/price-filter.tsx
    - apps/client/src/components/filters/attribute-filter.tsx
    - apps/client/src/components/filters/availability-filter.tsx
    - apps/client/src/components/filters/active-filters.tsx
  modified:
    - tests/hooks/use-filters.test.tsx
    - tests/filters/price-filter.test.tsx
    - tests/filters/attribute-filter.test.tsx
    - tests/filters/availability-filter.test.tsx
    - apps/client/package.json
    - package.json (workspace root)
    - pnpm-lock.yaml

key-decisions:
  - "Install nuqs at workspace root (not just apps/client) so vitest test runner can resolve it"
  - "Use plain Tailwind CSS for slider/checkbox UI components instead of shadcn/ui (shadcn requires Tailwind v3 config, project uses v4)"
  - "Use vi.hoisted() for mock variables referenced in vi.mock factory functions"
  - "Mock useFilters hook directly in component tests rather than mocking nuqs internals"

patterns-established:
  - "vi.hoisted(): Required for any mock variable used inside vi.mock() factory in ESM"
  - "Workspace root install: Client-only packages needed by root vitest must be installed at workspace root"
  - "Filter format: attributes stored as key:value strings (e.g., screen_size:32 inch)"

requirements-completed:
  - FILT-02
  - FILT-04

# Metrics
duration: 6min
completed: 2026-03-11
---

# Phase 06 Plan 02: Filter Components and URL State Summary

**nuqs-based useFilters hook with 8 URL params plus PriceFilter (dual slider + debounced inputs), AttributeFilter (SELECT/RANGE/BOOLEAN), AvailabilityFilter (stock checkboxes), and ActiveFilters (removable chips)**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-11T12:02:59Z
- **Completed:** 2026-03-11T12:08:22Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Created useFilters hook using nuqs useQueryStates with 8 type-safe filter params persisted to URL
- Built PriceFilter with dual-handle range slider, min/max dollar inputs, and 300ms debounced URL updates
- Built AttributeFilter that renders SELECT as checkboxes with facet counts, RANGE as slider, BOOLEAN as single checkbox
- Built AvailabilityFilter with in-stock/out-of-stock checkboxes showing product counts
- Built ActiveFilters showing removable badge chips for all active filters with "Clear all" button
- Converted 19 FILT-xx todo test stubs to real passing tests

## Task Commits

1. **Task 1: Install dependencies and create useFilters hook** - `6a66868` (feat)
2. **Task 2: Create filter components** - `7a05dc1` (feat)

## Files Created/Modified

- `apps/client/src/hooks/use-filters.ts` - nuqs-based hook with 8 URL filter params
- `apps/client/src/components/filters/price-filter.tsx` - Dual-handle slider + debounced inputs
- `apps/client/src/components/filters/attribute-filter.tsx` - Dynamic attribute rendering by type
- `apps/client/src/components/filters/availability-filter.tsx` - Stock availability checkboxes
- `apps/client/src/components/filters/active-filters.tsx` - Removable filter chips
- `tests/hooks/use-filters.test.tsx` - 5 tests for hook behavior
- `tests/filters/price-filter.test.tsx` - 5 tests for price filter
- `tests/filters/attribute-filter.test.tsx` - 5 tests for attribute filter
- `tests/filters/availability-filter.test.tsx` - 4 tests for availability filter

## Decisions Made

- **nuqs at workspace root:** vitest runs from workspace root so nuqs must be installed there, not just in apps/client
- **No shadcn/ui:** Project uses Tailwind CSS v4 without shadcn/ui config (only star-rating.tsx exists in ui/). Built custom slider/checkbox UI with plain Tailwind classes
- **vi.hoisted() pattern:** Mock variables used inside vi.mock() factories must be created with vi.hoisted() to avoid "cannot access before initialization" errors with ESM hoisting
- **Mock useFilters directly:** Component tests mock the useFilters hook module rather than mocking nuqs internals, giving cleaner isolated tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Install nuqs at workspace root for test resolution**
- **Found during:** Task 1 (running use-filters.test.tsx)
- **Issue:** nuqs installed only in apps/client but vitest runs from workspace root - module not found
- **Fix:** Added nuqs and use-debounce to workspace root package.json
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** Tests pass after workspace root install
- **Committed in:** 6a66868 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Build custom slider/checkbox instead of shadcn/ui**
- **Found during:** Task 2 (filter component creation)
- **Issue:** Plan says to use shadcn/ui but project has no components.json, uses Tailwind v4 which shadcn CLI doesn't support
- **Fix:** Built filter UI with plain Tailwind CSS, matching star-rating.tsx pattern in existing codebase
- **Files modified:** All filter component files
- **Verification:** Components render correctly in tests
- **Committed in:** 7a05dc1 (Task 2 commit)

**3. [Rule 1 - Bug] Use vi.hoisted() for mock variables in vi.mock factories**
- **Found during:** Task 1 (test authoring)
- **Issue:** Variables declared before vi.mock() cannot be accessed in factory due to ESM hoisting
- **Fix:** Wrap mock variables in vi.hoisted() call
- **Files modified:** tests/hooks/use-filters.test.tsx, tests/filters/*.test.tsx
- **Verification:** All 19 tests pass
- **Committed in:** 6a66868, 7a05dc1

---

**Total deviations:** 3 auto-fixed (1 blocking install, 1 missing critical UI, 1 bug fix)
**Impact on plan:** All deviations necessary for functionality and test compatibility. No scope creep.

## Issues Encountered

- ESM hoisting in vi.mock() factories requires vi.hoisted() pattern - documented as pattern for future filter tests

## Next Phase Readiness

- All 4 filter components are ready for integration into filter panel/sidebar (Phase 06-03)
- useFilters hook URL param names match what server-side filtering expects
- Test infrastructure pattern established for future filter component tests

## Self-Check: PASSED

All created files exist on disk. All task commits verified in git history.

---
*Phase: 06-filter-system*
*Completed: 2026-03-11*
