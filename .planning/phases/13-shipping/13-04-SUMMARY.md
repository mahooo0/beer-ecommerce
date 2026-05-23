---
phase: 13-shipping
plan: 04
subsystem: order-tracking-ui
tags: [admin-ui, client-ui, tracking, shipping]
dependencies:
  requires: [13-02-tracking-api]
  provides: [tracking-ui-admin, tracking-ui-client]
  affects: [order-detail-pages]
tech_stack:
  added: []
  patterns: [client-components, carrier-tracking-urls, conditional-rendering]
key_files:
  created:
    - apps/client/src/app/orders/[id]/page.tsx
    - apps/client/src/app/orders/[id]/tracking-section.tsx
  modified:
    - apps/client/src/lib/api.ts
decisions:
  - "TrackingSection conditionally renders only when order.shipping.trackingNumber exists"
  - "Carrier tracking URL map generates external links for USPS, FedEx, UPS, DHL"
  - "Other carrier option shows tracking number without clickable link"
  - "Client API fetches order by ID for detail page rendering"
  - "Status history timeline shows all order status changes with timestamps"
metrics:
  duration: 6m
  completed: 2026-03-11T05:37:25Z
---

# Phase 13 Plan 04: Admin Tracking Form and Client Tracking Display Summary

**Build admin tracking form and client tracking display for shipped orders.**

## What Was Built

### Task 1: Admin Order Detail Page with Tracking Form
**Status:** Already completed in previous commit (23a039b)

The admin order tracking functionality was already implemented in a previous plan execution. The following files already exist in HEAD:
- `apps/admin/src/app/dashboard/orders/[id]/page.tsx` (224 lines)
- `apps/admin/src/app/dashboard/orders/[id]/add-tracking-form.tsx` (113 lines)
- `apps/admin/src/lib/api.ts` (includes `getById` and `addTracking` methods)

These files provide:
- Order detail page with full order information display
- Tracking form with carrier dropdown (USPS, FedEx, UPS, DHL, Other)
- Tracking number input (disabled until carrier selected)
- Optional estimated delivery date picker
- Mark as Shipped button that calls PATCH `/api/orders/:id/tracking`
- Conditional rendering: form shows only for PAID/PROCESSING orders without tracking
- After tracking added, form is replaced with read-only tracking info display

### Task 2: Client Order Detail Page with Tracking Section
**Commit:** 924e004

Created client-facing order detail page with tracking visibility:

**apps/client/src/app/orders/[id]/tracking-section.tsx** (104 lines)
- Conditional rendering: returns null if no tracking number
- Carrier tracking URL map for USPS, FedEx, UPS, DHL
- Track Package button with external link (opens in new tab)
- Displays carrier, tracking number (monospace), shipped date, estimated delivery
- Status badge with color coding
- "Other" carrier shows tracking number without link

**apps/client/src/app/orders/[id]/page.tsx** (232 lines)
- Client order detail page with full order information
- Order header with order number, date, status badge
- Shipping address display
- TrackingSection component integration
- Order items list with images, names, attributes, quantities, prices
- Order summary with subtotal, shipping, tax, discount, total
- Status history timeline with all order status changes
- Loading and error states
- Back link to order history

**apps/client/src/lib/api.ts** (modified)
- Added `api.orders.getById(id)` method for fetching order details

## Deviations from Plan

### Auto-fixed Issues

**1. [Pre-existing Work] Admin tracking files already implemented**
- **Found during:** Task 1 execution
- **Issue:** Files `apps/admin/src/app/dashboard/orders/[id]/page.tsx` and `add-tracking-form.tsx` were already created in commit 23a039b (labeled as feat(13-03) but containing 13-04 work)
- **Action:** Verified files match plan requirements, skipped re-creation, documented in summary
- **Files:** apps/admin/src/app/dashboard/orders/[id]/*.tsx
- **Impact:** Task 1 was already complete, only Task 2 needed implementation

## Technical Decisions

### Carrier Tracking URL Pattern
Implemented as Record<string, (tn: string) => string> map for extensibility:
- USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels={tn}`
- FedEx: `https://www.fedex.com/fedextrack/?trknbr={tn}`
- UPS: `https://www.ups.com/track?tracknum={tn}`
- DHL: `https://www.dhl.com/en/express/tracking.html?AWB={tn}`

If carrier not in map (e.g., "Other"), tracking number is displayed without clickable link.

### Conditional Rendering Strategy
TrackingSection component returns null early if `!order.shipping?.trackingNumber`, ensuring tracking section only appears when tracking info exists.

### Admin Form UX
Tracking number input disabled until carrier selected - prevents incomplete form submission and guides user through proper workflow.

## Verification Results

### TypeScript Compilation
- Admin app: Pre-existing error in auth.ts (not related to our changes)
- Client app: Pre-existing errors in profile actions and auth.ts (not related to our changes)
- New tracking components: No TypeScript errors

### Must-Have Truths
- ✅ Admin can add tracking number with carrier selection to an order from the order detail page
- ✅ Customer can view tracking info (carrier, tracking number, shipped date) on order detail page
- ✅ Customer can click a link to track package on the carrier's website
- ✅ Tracking section only shows when order has tracking info

### Key Links Verified
- ✅ `apps/admin/src/app/dashboard/orders/[id]/add-tracking-form.tsx` → `apps/admin/src/lib/api.ts` via `api.orders.addTracking`
- ✅ `apps/client/src/app/orders/[id]/tracking-section.tsx` → carrier tracking URLs via `carrierTrackingUrls` map

## Files Changed

### Created (2 files)
- `apps/client/src/app/orders/[id]/page.tsx` - Client order detail page with full order display
- `apps/client/src/app/orders/[id]/tracking-section.tsx` - Tracking info component with carrier links

### Modified (1 file)
- `apps/client/src/lib/api.ts` - Added orders.getById method

### Pre-existing (3 files - from commit 23a039b)
- `apps/admin/src/app/dashboard/orders/[id]/page.tsx` - Admin order detail page
- `apps/admin/src/app/dashboard/orders/[id]/add-tracking-form.tsx` - Admin tracking form
- `apps/admin/src/lib/api.ts` - Admin API with tracking methods

## Integration Points

### Upstream Dependencies
- **13-02-tracking-api**: PATCH `/api/orders/:id/tracking` endpoint (provides tracking storage)
- **@repo/types**: Order, ShippingInfo, OrderStatus types

### Downstream Effects
- **Customer experience**: Customers can now track their shipments via carrier websites
- **Admin workflow**: Admins can mark orders as shipped with tracking info
- **Order detail pages**: Both admin and client now show comprehensive order information with tracking

## Next Steps

The tracking UI is complete. Future plans may include:
- Automated tracking status updates via carrier APIs (webhooks)
- Email notifications when tracking is added
- Delivery confirmation page
- Return/refund tracking integration

## Self-Check

### Created Files Verification
```
FOUND: apps/client/src/app/orders/[id]/page.tsx
FOUND: apps/client/src/app/orders/[id]/tracking-section.tsx
```

### Commits Verification
```
FOUND: 924e004 (Task 2: Client order detail page with tracking section)
```

### Pre-existing Files Verification
```
FOUND: apps/admin/src/app/dashboard/orders/[id]/page.tsx (in commit 23a039b)
FOUND: apps/admin/src/app/dashboard/orders/[id]/add-tracking-form.tsx (in commit 23a039b)
```

## Self-Check: PASSED

All created files exist, commit is recorded, and pre-existing admin files are verified in repository history.
