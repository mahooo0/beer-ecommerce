---
phase: 14-inventory-management
plan: 01
subsystem: api
tags: [inventory, warehouse, prisma, zod, haversine, sku, events]

# Dependency graph
requires:
  - phase: 14-00
    provides: test stubs, setup.ts inventory mocks, fixture files
  - phase: 01-foundation
    provides: Prisma schema with Warehouse, InventoryItem, StockMovement models
provides:
  - InventoryService singleton with stock tracking, warehouse CRUD, routing, movements, alerts, SKU generation
  - Zod validation schemas for all 8 inventory endpoints
  - inventory.lowStock and inventory.stockUpdated events added to EventMap
  - 22 passing unit tests covering INV-01 through INV-08
affects: [14-02, 14-03, 14-04, 17-notifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Haversine distance for nearest-warehouse routing with priority fallback
    - available(item) helper consistently used to compute quantity - reserved
    - Event emission pattern for cross-module notifications (inventory.lowStock, inventory.stockUpdated)
    - vi.hoisted() for event bus mock in Vitest 4.x ESM test files

key-files:
  created:
    - apps/server/src/modules/inventory/inventory.service.ts
    - apps/server/src/modules/inventory/inventory.validation.ts
  modified:
    - apps/server/src/common/events/event-bus.ts
    - tests/setup.ts
    - tests/inventory/inventory.service.test.ts

key-decisions:
  - "Use available(item) helper function everywhere to prevent exposing raw quantity without reserved"
  - "Add productVariant.findUnique to prismaMock for SKU uniqueness tests"
  - "Use vi.hoisted() for eventBus emit mock to satisfy Vitest 4.x ESM hoisting requirement"
  - "RESERVATION and RESERVATION_RELEASE excluded from adjustStockSchema - system-only reasons"
  - "getDashboardData uses $queryRaw COUNT for low stock to match getLowStockAlerts raw query pattern"

patterns-established:
  - "Pattern: InventoryService follows ShippingService class structure - import prisma from @repo/db, throw AppError, export singleton"
  - "Pattern: Zod schemas use z.object({ body: z.object({...}) }) for POST/PUT, z.object({ query: ... }) for GET"
  - "Pattern: findBestWarehouse returns { inventoryItemId, variantId, warehouseId, warehouseName, available } object"

requirements-completed: [INV-01, INV-02, INV-03, INV-04, INV-07, INV-08]

# Metrics
duration: 6min
completed: 2026-03-11
---

# Phase 14 Plan 01: InventoryService and Validation Schemas Summary

**InventoryService class with Haversine nearest-warehouse routing, available=quantity-reserved helper, eventBus integration, and 8 Zod validation schemas covering all inventory endpoints**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-11T16:12:10Z
- **Completed:** 2026-03-11T16:17:31Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- InventoryService singleton with 10 methods: getStockByVariant, getStockLevel, getLowStockAlerts, createWarehouse, getWarehouses, updateWarehouse, deactivateWarehouse, findBestWarehouse, adjustStock, getMovements, generateSku, getDashboardData
- Haversine distance formula for nearest-warehouse routing, with priority-based fallback when coordinates are null
- 8 Zod validation schemas covering all planned inventory endpoints (createWarehouse, updateWarehouse, adjustStock, getMovements, reserveStock, commitReservation, releaseReservation, getStock)
- 22 unit tests passing covering INV-01 through INV-08 requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: InventoryService with stock tracking, warehouse CRUD, routing, movements, alerts, and SKU generation** - `f4a3e3f` (feat + test TDD)
2. **Task 2: Zod validation schemas for inventory endpoints** - `cad4472` (feat)

## Files Created/Modified

- `apps/server/src/modules/inventory/inventory.service.ts` - InventoryService class exported as singleton with all business logic
- `apps/server/src/modules/inventory/inventory.validation.ts` - 8 Zod schemas for all inventory endpoints
- `apps/server/src/common/events/event-bus.ts` - Added inventory.lowStock and inventory.stockUpdated to EventMap
- `tests/setup.ts` - Extended prismaMock with productVariant.findUnique for SKU uniqueness checks
- `tests/inventory/inventory.service.test.ts` - 22 real tests replacing it.todo() stubs

## Decisions Made

- `available(item)` helper function used consistently throughout the service instead of raw `item.quantity` to prevent off-by-one errors in stock availability
- `vi.hoisted()` required for event bus emit mock due to Vitest 4.x ESM hoisting rules
- `RESERVATION` and `RESERVATION_RELEASE` excluded from `adjustStockSchema` enum — these are system-only reasons used by the reservation system (Plan 14-02)
- `productVariant` model in prismaMock extended with `findUnique` to support SKU uniqueness checks in tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Extended productVariant mock in tests/setup.ts**
- **Found during:** Task 1 (generateSku tests)
- **Issue:** prismaMock.productVariant only had createMany/deleteMany — missing findUnique needed for SKU uniqueness checks
- **Fix:** Extended productVariant mock to include findUnique, findMany, create, update
- **Files modified:** tests/setup.ts
- **Verification:** SKU collision tests pass using prismaMock.productVariant.findUnique
- **Committed in:** f4a3e3f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (missing critical mock method)
**Impact on plan:** Essential for SKU uniqueness test coverage. No scope creep.

## Issues Encountered

- Vitest 4.x ESM hoisting: `emitMock` declared with `const` outside `vi.hoisted()` caused "Cannot access before initialization" error. Fixed by wrapping in `vi.hoisted()` as `eventBusMocks.emitMock`.

## Next Phase Readiness

- InventoryService is ready to be consumed by API routes (Plan 14-03)
- Zod schemas are ready for controller/route integration
- Event types are registered — Phase 17 (Notifications) can subscribe to inventory.lowStock

---
*Phase: 14-inventory-management*
*Completed: 2026-03-11*
