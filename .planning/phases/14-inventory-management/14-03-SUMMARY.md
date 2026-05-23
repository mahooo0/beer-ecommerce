---
phase: 14-inventory-management
plan: 03
subsystem: api
tags: [express, typescript, inventory, warehouse, stock-reservation]

# Dependency graph
requires:
  - phase: 14-inventory-management
    plan: 02
    provides: "InventoryService, inventory.validation.ts, reservation.cleanup.ts"

provides:
  - "InventoryController with 13 HTTP request handlers"
  - "Express router mounted at /api/inventory with admin and public reservation routes"
  - "Admin API client inventory namespace with dashboard, stock, alerts, warehouses, movements methods"
  - "Reservation cleanup cron started at server startup"

affects: [14-04-admin-ui, checkout-flow, payment-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Controller class with try/catch/next(error) error delegation"
    - "Route-level middleware chain: requireAdmin → validate(schema) → controller method"
    - "Public reservation endpoints without requireAdmin for checkout consumption"
    - "Auto-select best warehouse when warehouseId omitted in reserveStock"

key-files:
  created:
    - apps/server/src/modules/inventory/inventory.controller.ts
    - apps/server/src/modules/inventory/inventory.routes.ts
  modified:
    - apps/server/src/index.ts
    - apps/admin/src/lib/api.ts

key-decisions:
  - "getWarehouseById implemented inline in controller using prisma.warehouse.findUnique with inventoryItems include — service has no such method"
  - "reserveStock controller auto-selects best warehouse via findBestWarehouse when warehouseId not provided in request body"
  - "Reservation endpoints (reserve/commit/release) are public — no requireAdmin — for checkout flow"

patterns-established:
  - "Controller imports service and calls methods with destructured req.body params (not passing req.body directly)"
  - "Admin namespace in api.ts uses URLSearchParams for query param building, consistent with other namespaces"

requirements-completed: [INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, INV-07, INV-08]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 14 Plan 03: Inventory Routes, Controller, and Admin API Client Summary

**Express inventory controller with 13 handlers, admin-protected routes at /api/inventory, and admin API client inventory namespace covering dashboard, stock, warehouses, alerts, and movements.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-11T16:23:52Z
- **Completed:** 2026-03-11T16:27:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created InventoryController class with 13 methods covering all InventoryService operations
- Created inventory.routes.ts with 11 routes split between admin-protected and public reservation endpoints
- Updated server index.ts to mount /api/inventory and start reservation cleanup cron on startup
- Extended admin api.ts with a full `inventory` namespace mirroring the shipping namespace pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Inventory controller, routes, and server wiring** - `0b27d22` (feat)
2. **Task 2: Extend admin API client with inventory namespace** - `b2b9035` (feat)

## Files Created/Modified

- `apps/server/src/modules/inventory/inventory.controller.ts` - InventoryController class with 13 request handler methods
- `apps/server/src/modules/inventory/inventory.routes.ts` - Express router with all inventory endpoints
- `apps/server/src/index.ts` - Added inventoryRoutes mount and startReservationCleanup() call
- `apps/admin/src/lib/api.ts` - Added inventory namespace with dashboard, stock, alerts, warehouses, movements

## Decisions Made

- `getWarehouseById` is not in InventoryService, so the controller implements it directly via `prisma.warehouse.findUnique` with inventoryItems include
- `reserveStock` controller auto-selects the best warehouse using `inventoryService.findBestWarehouse` when `warehouseId` is omitted from the request body — matches the optional field in reserveStockSchema
- Reservation endpoints (POST /reserve, /commit, /release) have no requireAdmin middleware — they are called by the checkout flow

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Auto-select best warehouse in reserveStock controller**
- **Found during:** Task 1 (inventory controller implementation)
- **Issue:** reserveStockSchema marks warehouseId as optional — controller would crash if undefined was passed to service
- **Fix:** Added findBestWarehouse call when warehouseId is omitted, returning 409 if no warehouse has sufficient stock
- **Files modified:** apps/server/src/modules/inventory/inventory.controller.ts
- **Verification:** TypeScript compiles cleanly, logic handles both provided and omitted warehouseId
- **Committed in:** 0b27d22 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - missing critical null guard)
**Impact on plan:** Essential for correctness — without it, undefined warehouseId would cause a runtime crash in the service layer.

## Issues Encountered

- `getWarehouseById` missing from InventoryService — addressed by implementing directly in controller using prisma (minor, well-contained)
- Pre-existing TypeScript errors in category.controller.ts, product.service.ts, and search/sync.service.ts — out of scope, not introduced by this plan

## Next Phase Readiness

- All /api/inventory endpoints are live and accessible via the admin API client
- Plan 04 (admin UI) can consume all inventory data via `api.inventory.*`
- Reservation cleanup cron is active from server startup

---
*Phase: 14-inventory-management*
*Completed: 2026-03-11*

## Self-Check: PASSED

- FOUND: apps/server/src/modules/inventory/inventory.controller.ts
- FOUND: apps/server/src/modules/inventory/inventory.routes.ts
- FOUND: .planning/phases/14-inventory-management/14-03-SUMMARY.md
- FOUND commit 0b27d22: feat(14-03): add inventory controller, routes, and server wiring
- FOUND commit b2b9035: feat(14-03): extend admin API client with inventory namespace
