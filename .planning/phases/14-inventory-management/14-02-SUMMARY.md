---
phase: 14-inventory-management
plan: 02
subsystem: api
tags: [prisma, transactions, cron, inventory, reservations, node-cron]

# Dependency graph
requires:
  - phase: 14-01
    provides: InventoryService class with stock tracking methods and AppError/eventBus wiring
provides:
  - reserveStock method using prisma.$transaction with atomic increment for oversell prevention
  - commitReservation method converting RESERVATION to SALE movements
  - releaseReservation method with idempotency guarantee
  - releaseExpiredReservations method with 15-minute TTL cutoff
  - startReservationCleanup() cron job (every minute) in reservation.cleanup.ts
affects: [15-checkout, 16-orders, 17-notifications]

# Tech tracking
tech-stack:
  added: [node-cron@^4.2.1, @types/node-cron@^3.0.11]
  patterns:
    - prisma.$transaction interactive callback pattern for atomic read-modify-write
    - Idempotency via RESERVATION_RELEASE movement matching
    - TTL-based cleanup with cron + cutoff date query

key-files:
  created:
    - apps/server/src/modules/inventory/reservation.cleanup.ts
    - tests/inventory/reservation.test.ts (converted from stubs to full tests)
  modified:
    - apps/server/src/modules/inventory/inventory.service.ts

key-decisions:
  - "Use prisma.$transaction interactive callback for reserveStock to prevent TOCTOU race conditions"
  - "releaseReservation idempotency via Set<inventoryItemId> from existing RESERVATION_RELEASE movements"
  - "releaseExpiredReservations groups by reference and delegates to releaseReservation for DRY cleanup"
  - "startReservationCleanup() not wired into index.ts yet - deferred to Plan 03 when routes are mounted"
  - "RESERVATION movements use negative quantity (-qty) to match convention in stock movement history"

patterns-established:
  - "Reservation pattern: reserve (hold reserved), commit (decrement quantity+reserved), release (decrement reserved)"
  - "Idempotency pattern: check for matching release movements before applying, return silently if already done"
  - "Cron cleanup pattern: cutoff = Date.now() - TTL, query createdAt < cutoff, delegate to idempotent release"

requirements-completed: [INV-05]

# Metrics
duration: 2.1min
completed: 2026-03-11
---

# Phase 14 Plan 02: Atomic Stock Reservation Summary

**Atomic stock reservation with prisma.$transaction, idempotent release, and node-cron TTL cleanup preventing overselling during checkout**

## Performance

- **Duration:** 2.1 min
- **Started:** 2026-03-11T16:19:35Z
- **Completed:** 2026-03-11T16:21:42Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- reserveStock/commitReservation/releaseReservation/releaseExpiredReservations added to InventoryService
- All operations inside prisma.$transaction for atomicity - zero race condition window
- node-cron cleanup job created, running every minute with 15-min TTL
- 9 reservation tests converted from it.todo() stubs to passing tests

## Task Commits

1. **Task 1: Atomic reservation methods on InventoryService** - `0565c86` (feat)
2. **Task 2: Reservation cleanup cron job** - `04cced6` (feat)

**Plan metadata:** (docs commit pending)

_Note: Task 1 followed TDD - tests written first (RED), then implementation (GREEN)_

## Files Created/Modified

- `apps/server/src/modules/inventory/inventory.service.ts` - Added reserveStock, commitReservation, releaseReservation, releaseExpiredReservations methods
- `apps/server/src/modules/inventory/reservation.cleanup.ts` - New file: startReservationCleanup() cron job
- `tests/inventory/reservation.test.ts` - Converted 9 it.todo() stubs to real passing tests
- `apps/server/package.json` - Added node-cron and @types/node-cron

## Decisions Made

- Used prisma.$transaction interactive callback (`(tx) => { ... }`) rather than array form — required for read-then-write atomicity (checking available before incrementing reserved)
- releaseReservation idempotency implemented by checking for existing RESERVATION_RELEASE movements matching the same `reference` and `inventoryItemId` combination
- releaseExpiredReservations groups expired unreleased movements by `reference` field and calls the existing idempotent releaseReservation — avoids code duplication
- startReservationCleanup() not wired into server startup yet — deferred to Plan 03 when inventory routes are mounted and the module initializes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all implementations matched specifications, all 9 tests pass on first attempt.

## User Setup Required

None - no external service configuration required. node-cron is a Node.js library with no external dependencies.

## Next Phase Readiness

- Plan 03 can now mount inventory routes and call `startReservationCleanup()` at server startup
- checkout integration can call `reserveStock()` → `commitReservation()` on payment success → `releaseReservation()` on abandon
- All reservation movements are referenced by `checkoutSessionId` for traceability

---
*Phase: 14-inventory-management*
*Completed: 2026-03-11*
