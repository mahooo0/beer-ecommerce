---
phase: 22
plan: 03
subsystem: in-app-guidance
tags: [driver.js, help-tooltip, tour, localStorage, client, admin]
dependency_graph:
  requires:
    - 22-00 (driver.js installed in both apps)
  provides:
    - HelpTooltip component (client + admin)
    - useTour hook with Driver.js + localStorage persistence
    - Tour step definitions: homepage, product, dashboard, productCreate
  affects:
    - apps/client/src/components/guidance/
    - apps/admin/src/components/guidance/
tech_stack:
  added: []
  patterns:
    - HelpTooltip: stateful ? button with CSS-positioned popover and arrow triangle
    - useTour: useCallback + useState wrapping Driver.js driver() factory
    - localStorage persistence: tour_completed_{tourId} key set in onDestroyed callback
    - Tour data: plain TypeScript arrays of DriveStep, no 'use client' needed
key_files:
  created:
    - apps/client/src/components/guidance/HelpTooltip.tsx
    - apps/client/src/components/guidance/useTour.ts
    - apps/client/src/components/guidance/tours/homepageTour.ts
    - apps/client/src/components/guidance/tours/productTour.ts
    - apps/admin/src/components/guidance/HelpTooltip.tsx
    - apps/admin/src/components/guidance/useTour.ts
    - apps/admin/src/components/guidance/tours/dashboardTour.ts
    - apps/admin/src/components/guidance/tours/productCreateTour.ts
  modified: []
decisions:
  - "HelpTooltip uses inline CSS border trick for arrow triangles — no external library, keeps bundle minimal"
  - "useTour reads localStorage in useState initializer with typeof window guard for SSR safety"
  - "Tour step files are plain TypeScript (no 'use client') since they export data arrays, not components"
metrics:
  duration: 102s
  completed: "2026-03-12"
  tasks_completed: 2
  files_created: 8
  files_modified: 0
---

# Phase 22 Plan 03: In-App Guidance Components Summary

**One-liner:** HelpTooltip ? button with CSS-positioned popovers and useTour hook wrapping Driver.js with localStorage persistence, plus 4 tour definitions (15 steps total) for homepage, product, admin dashboard, and product creation flows.

## What Was Built

### Task 1: HelpTooltip and useTour Hook

**HelpTooltip.tsx** (identical in both apps):
- `'use client'` component
- Props: `content: string`, `side?: 'top' | 'bottom' | 'left' | 'right'` (default: top)
- Renders a `?` button (w-5 h-5 rounded-full) with hover/click toggle
- Positioned tooltip div (z-50, w-52, bg-gray-900) with CSS border-trick arrow triangle
- Side positioning: top=bottom-7, bottom=top-7, left=right-7, right=left-7

**useTour.ts** (identical in both apps):
- Returns `{ startTour, isCompleted, resetTour }`
- `startTour()`: checks localStorage first (no-op if completed), creates Driver.js instance, calls `.drive()`
- `isCompleted`: initialized from localStorage with SSR guard
- `resetTour()`: removes localStorage key, resets state
- Imports `driver.js/dist/driver.css` for tour styling

### Task 2: Tour Step Definitions

| File | Export | Steps | Elements Targeted |
|------|--------|-------|-------------------|
| `homepageTour.ts` | `homepageTourSteps` | 3 | #search-bar, #mega-menu, #cart-icon |
| `productTour.ts` | `productTourSteps` | 3 | #product-gallery, #variant-selector, #add-to-cart-btn |
| `dashboardTour.ts` | `dashboardTourSteps` | 5 | #sidebar-products, #sidebar-orders, #sidebar-categories, #sidebar-shipping, #sidebar-inventory |
| `productCreateTour.ts` | `productCreateTourSteps` | 4 | #product-type-select, #product-basic-info, #product-images, #product-status |

All 4 files are plain TypeScript (no `'use client'`) importing only `DriveStep` type from driver.js.

## Decisions Made

- **HelpTooltip arrow triangles:** Used inline CSS border trick (`border-4` with transparent sides) instead of an SVG or pseudo-element. Keeps component self-contained with zero additional dependencies.
- **useTour SSR guard:** `typeof window === 'undefined'` check in useState initializer prevents localStorage access during server-side rendering in Next.js App Router.
- **Tour data files as plain TS:** Step definition files don't import React or use any browser APIs, so `'use client'` is unnecessary — they are pure data modules.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

All 8 files exist and pass automated checks:

```
test -f apps/client/src/components/guidance/HelpTooltip.tsx       ✓
test -f apps/client/src/components/guidance/useTour.ts             ✓
test -f apps/admin/src/components/guidance/HelpTooltip.tsx         ✓
test -f apps/admin/src/components/guidance/useTour.ts              ✓
grep -q "driver.js" apps/client/src/components/guidance/useTour.ts ✓
test -f apps/client/src/components/guidance/tours/homepageTour.ts  ✓
test -f apps/client/src/components/guidance/tours/productTour.ts   ✓
test -f apps/admin/src/components/guidance/tours/dashboardTour.ts  ✓
test -f apps/admin/src/components/guidance/tours/productCreateTour.ts ✓
```

## Self-Check

- [x] `apps/client/src/components/guidance/HelpTooltip.tsx` — created
- [x] `apps/client/src/components/guidance/useTour.ts` — created
- [x] `apps/client/src/components/guidance/tours/homepageTour.ts` — created
- [x] `apps/client/src/components/guidance/tours/productTour.ts` — created
- [x] `apps/admin/src/components/guidance/HelpTooltip.tsx` — created
- [x] `apps/admin/src/components/guidance/useTour.ts` — created
- [x] `apps/admin/src/components/guidance/tours/dashboardTour.ts` — created
- [x] `apps/admin/src/components/guidance/tours/productCreateTour.ts` — created
- [x] Commit ca02b55 — feat(22-03): add HelpTooltip component and useTour hook for both apps
- [x] Commit b450d93 — feat(22-03): add Driver.js tour step definitions for client and admin

## Self-Check: PASSED
