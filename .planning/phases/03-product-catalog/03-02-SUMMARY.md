---
phase: 03-product-catalog
plan: 02
subsystem: ui
tags: [cloudinary, next-cloudinary, dnd-kit, image-upload, drag-drop]

# Dependency graph
requires:
  - phase: 02-authentication
    provides: Admin app foundation with routing structure
provides:
  - Cloudinary signed upload integration for secure image uploads
  - Reusable ImageManager component with drag-and-drop reordering
  - SortableImage component for individual image management
affects: [03-03, 03-04, 03-05, product-catalog, media-management]

# Tech tracking
tech-stack:
  added: [next-cloudinary, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, cloudinary]
  patterns: [signed uploads for secure credentials, component-based image management, drag-drop UX]

key-files:
  created:
    - apps/admin/src/app/api/sign-cloudinary/route.ts
    - apps/admin/src/components/product/image-manager.tsx
    - apps/admin/src/components/product/sortable-image.tsx
    - tests/e2e/image-upload.test.ts
  modified:
    - .env.example
    - apps/admin/package.json

key-decisions:
  - "Use signed uploads instead of unsigned to keep Cloudinary API credentials server-side"
  - "Use upload preset 'products' for Cloudinary configuration (user creates in dashboard)"
  - "Limit image uploads to 5MB per file for performance"
  - "Support JPG, PNG, and WebP formats for broad compatibility"
  - "Apply 200x200 thumbnail transformation for grid display efficiency"

patterns-established:
  - "Cloudinary signed endpoint pattern: /api/sign-cloudinary POST handler with api_sign_request"
  - "Image manager component props pattern: images array + onChange callback"
  - "Drag-drop activation constraint (distance: 5) prevents accidental drags"
  - "SortableContext with rectSortingStrategy for grid layouts"

requirements-completed: [PROD-06]

# Metrics
duration: 2.6min
completed: 2026-03-10
---

# Phase 03 Plan 02: Cloudinary Image Upload Integration Summary

**Cloudinary signed upload integration with drag-and-drop image manager component using next-cloudinary and @dnd-kit**

## Performance

- **Duration:** 2.6 min (155 seconds)
- **Started:** 2026-03-10T21:35:39Z
- **Completed:** 2026-03-10T21:38:14Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Cloudinary signing endpoint for secure server-side credential handling
- ImageManager component with CldUploadWidget integration
- Drag-and-drop image reordering with visual feedback
- Image removal functionality with hover-based UI
- Comprehensive test coverage for signing logic and component behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create Cloudinary signing endpoint** - `bbfd57b` (chore)
2. **Task 2: Create ImageManager and SortableImage components** - `fc80e1f` (feat)

## Files Created/Modified
- `apps/admin/src/app/api/sign-cloudinary/route.ts` - POST endpoint that signs Cloudinary upload requests using API secret
- `apps/admin/src/components/product/image-manager.tsx` - Main image upload component with CldUploadWidget, drag-drop reordering, and maxFiles limit
- `apps/admin/src/components/product/sortable-image.tsx` - Individual draggable image card with remove button and thumbnail transformation
- `tests/e2e/image-upload.test.ts` - Unit tests for signing logic, image removal, reordering, and maxFiles constraint
- `.env.example` - Added NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- `apps/admin/package.json` - Added next-cloudinary, @dnd-kit packages, and cloudinary SDK

## Decisions Made
- Used signed uploads instead of unsigned to prevent exposing Cloudinary API credentials to client
- Configured CldUploadWidget with signatureEndpoint pointing to /api/sign-cloudinary
- Applied PointerSensor with activationConstraint distance 5 to prevent accidental drag operations
- Used Image component from next/image with Cloudinary transformation (w_200,h_200,c_fill) for efficient thumbnails
- Set maxFileSize to 5MB and supported formats to jpg, jpeg, png, webp for client-side validation
- Implemented remove button with opacity transition on hover for better UX

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All dependencies installed successfully, components implemented as specified, and tests passed on first run.

## User Setup Required

**External services require manual configuration.**

Users must complete the following setup before image uploads will work:

### 1. Create Cloudinary Account
- Sign up at https://cloudinary.com
- Access dashboard at https://console.cloudinary.com

### 2. Environment Variables
Add to `.env.local` (copy from `.env.example`):
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Where to find values:**
- Navigate to: Cloudinary Dashboard → Settings
- Cloud name: Displayed in Account settings
- API Key: Displayed in API Keys section
- API Secret: Displayed in API Keys section (click "Reveal" to view)

### 3. Create Upload Preset
- Navigate to: Cloudinary Dashboard → Settings → Upload → Upload Presets
- Click "Add upload preset"
- Set preset name: `products`
- Choose signing mode: Signed (recommended) or Unsigned
- Configure transformation settings if desired (optional)
- Save preset

### 4. Verification
Test the integration:
```bash
# Start admin app
pnpm --filter admin dev

# Navigate to any page using ImageManager component
# Click upload button - Cloudinary widget should open
# Upload test image - should appear in grid with drag handles
```

## Next Phase Readiness

**Ready for integration:** ImageManager component is ready to be integrated into product form (Plan 04).

**Available capabilities:**
- Multi-image upload with progress feedback
- Drag-and-drop reordering preserves image priority
- Individual image removal
- Configurable maxFiles limit (default 10)
- Automatic thumbnail generation via Cloudinary transformations

**Next steps (Plan 04):**
- Wire ImageManager into product creation form
- Store image URLs in product.images array field
- Validate at least one image is uploaded before saving product

## Self-Check: PASSED

All files created:
- FOUND: apps/admin/src/app/api/sign-cloudinary/route.ts
- FOUND: apps/admin/src/components/product/image-manager.tsx
- FOUND: apps/admin/src/components/product/sortable-image.tsx
- FOUND: tests/e2e/image-upload.test.ts

All commits exist:
- FOUND: bbfd57b (Task 1)
- FOUND: fc80e1f (Task 2)

---
*Phase: 03-product-catalog*
*Completed: 2026-03-10*
