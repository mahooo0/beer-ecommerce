---
phase: 13-shipping
plan: 02
subsystem: order-tracking
tags: [tracking, shipment, admin, events]
dependency_graph:
  requires:
    - OrderModel with IShippingInfo interface
    - EventBus infrastructure
    - requireAdmin middleware
  provides:
    - OrderService.addTracking method
    - PATCH /api/orders/:id/tracking endpoint
    - order.shipped event emission
  affects:
    - Order status workflow
    - Event-driven architecture
tech_stack:
  added: []
  patterns:
    - State validation before tracking addition
    - Atomic MongoDB updates with $set and $push
    - Event emission for shipment notifications
key_files:
  created:
    - apps/server/src/modules/order/order.service.ts
    - apps/server/src/modules/order/order.controller.ts
    - apps/server/src/modules/order/order.routes.ts
    - apps/server/src/common/events/event-bus.ts
  modified: []
decisions:
  - choice: "Validate order is in paid/processing state before allowing tracking"
    rationale: "Prevents invalid state transitions - can't ship pending or cancelled orders"
    impact: "400 error if order not in shippable state"
  - choice: "Use MongoDB $set and $push operators in single update"
    rationale: "Atomic operation ensures shipping info and status history always stay in sync"
    impact: "No race conditions between status update and history logging"
  - choice: "Make estimatedDelivery optional in tracking addition"
    rationale: "Not all carriers provide delivery estimates at ship time"
    impact: "Flexible API supports various carrier integrations"
metrics:
  duration_seconds: 130
  tasks_completed: 2
  files_modified: 4
  commits: 2
  completed_at: "2026-03-11T05:26:38Z"
---

# Phase 13 Plan 02: Order Tracking Management Summary

**One-liner:** Admin tracking endpoint with carrier validation and order.shipped event emission for shipment workflow.

## Objective

Add tracking number and carrier management to the order service, enabling admins to mark orders as shipped with tracking info. This provides the server-side capability for admin UI integration and customer shipment notifications.

## Execution Summary

Implemented PATCH /api/orders/:id/tracking endpoint with state validation, atomic MongoDB updates, and event emission for downstream systems.

## Tasks Completed

### Task 1: Add tracking to order service and update event bus
**Files:** `apps/server/src/modules/order/order.service.ts`, `apps/server/src/common/events/event-bus.ts`
**Commit:** a829566

Added order.shipped event type to EventMap with carrier and tracking details. Implemented OrderService.addTracking method with:
- State validation ensuring order is in paid/processing status
- Atomic MongoDB update using $set for shipping fields and $push for status history
- Automatic status transition from paid/processing to shipped
- Event emission with orderId, userId, carrier, and trackingNumber

### Task 2: Add tracking controller endpoint and route
**Files:** `apps/server/src/modules/order/order.controller.ts`, `apps/server/src/modules/order/order.routes.ts`
**Commit:** 52fbc94

Created OrderController.addTracking handler with request validation and error handling. Registered PATCH /:id/tracking route with requireAdmin middleware for admin-only access. Returns 400 if carrier or trackingNumber missing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error in controller**
- **Found during:** Task 2
- **Issue:** req.params.id type was 'string | string[] | undefined' not compatible with service method expecting 'string'
- **Fix:** Added type assertion 'as string' to match existing controller pattern
- **Files modified:** apps/server/src/modules/order/order.controller.ts
- **Commit:** 52fbc94 (included in Task 2 commit)

## Verification Results

- TypeScript compilation passes for all modified files (order.service.ts, order.controller.ts, order.routes.ts, event-bus.ts)
- Pre-existing TypeScript errors in product.service.ts and shipping.controller.ts are out of scope
- EventBus type map includes order.shipped event type
- OrderService.addTracking validates shippable state before updating
- PATCH /:id/tracking route registered with requireAdmin middleware

## Success Criteria Met

- [x] PATCH /api/orders/:id/tracking endpoint accepts carrier and trackingNumber
- [x] Order status changes from paid/processing to shipped with statusHistory entry
- [x] Carrier and tracking number validation (400 if missing)
- [x] State validation prevents tracking on non-shippable orders (400 if wrong status)
- [x] order.shipped event emitted with orderId, userId, carrier, trackingNumber
- [x] Atomic update ensures shipping info and status stay synchronized

## Must-Haves Delivered

**Truths:**
- [x] Admin can add tracking number with carrier to an order via API
- [x] Adding tracking updates order status to shipped and records status history
- [x] Carrier is required when tracking number is provided
- [x] order.shipped event is emitted when tracking is added

**Artifacts:**
- [x] apps/server/src/modules/order/order.service.ts provides addTracking method on OrderService
- [x] apps/server/src/modules/order/order.controller.ts provides addTracking endpoint handler
- [x] apps/server/src/modules/order/order.routes.ts provides PATCH /orders/:id/tracking route
- [x] apps/server/src/common/events/event-bus.ts provides order.shipped event type

**Key Links:**
- [x] OrderService.addTracking uses OrderModel.findByIdAndUpdate with $set shipping and $push statusHistory
- [x] OrderService.addTracking calls eventBus.emit('order.shipped')

## Technical Notes

**State Validation Pattern:**
The addTracking method follows a validate-then-update pattern:
1. Fetch current order to check status
2. Validate order is in shippable state (paid or processing)
3. Perform atomic update with both shipping data and status history
4. Emit event for downstream consumers

This ensures orders cannot be marked as shipped from invalid states (pending, cancelled, already delivered).

**MongoDB Update Strategy:**
Used $set and $push operators in a single findByIdAndUpdate call to atomically update both shipping fields and append to statusHistory array. This prevents race conditions where status could change without history being recorded.

**Event Emission:**
The order.shipped event includes userId to enable downstream systems to send customer notifications without additional database lookups.

## Next Steps

This plan provides the API foundation. Remaining shipping work:
- Plan 03: Carrier integration service (shipping rate calculation)
- Plan 04: Admin UI for adding tracking to orders
- Plan 05: Customer-facing shipment tracking page

## Self-Check

Verifying deliverables:

- [x] apps/server/src/modules/order/order.service.ts exists with addTracking method
- [x] apps/server/src/modules/order/order.controller.ts exists with addTracking handler
- [x] apps/server/src/modules/order/order.routes.ts exists with tracking route
- [x] apps/server/src/common/events/event-bus.ts exists with order.shipped event
- [x] Commit a829566 exists (Task 1)
- [x] Commit 52fbc94 exists (Task 2)

## Self-Check: PASSED
