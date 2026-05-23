---
phase: 03-product-catalog
plan: 06
subsystem: product-management
tags: [bulk-operations, csv-import, validation, papa-parse]
completed: 2026-03-10T22:09:28Z
duration_seconds: 364

dependencies:
  requires:
    - 03-01-SUMMARY.md # Product service and validation
  provides:
    - csv-import-endpoint
    - bulk-operations-api
  affects:
    - admin-workflows

tech_stack:
  added:
    - multer@2.1.1 # File upload middleware
    - papaparse@5.5.3 # CSV parsing library
  patterns:
    - streaming-csv-parse
    - per-row-validation
    - error-accumulation

key_files:
  created:
    - apps/server/src/middleware/upload.middleware.ts
  modified:
    - apps/server/src/modules/product/product.service.ts
    - apps/server/src/modules/product/product.controller.ts
    - apps/server/src/modules/product/product.routes.ts
    - tests/products/csv-import.test.ts
    - tests/setup.ts

decisions:
  - choice: Use multer memoryStorage instead of diskStorage
    rationale: Files stored in buffer for streaming parse, no cleanup needed
  - choice: Reject VARIABLE products in CSV import
    rationale: Too complex with nested variants and options - use admin form
  - choice: Process rows sequentially not in parallel
    rationale: Avoid overwhelming database with concurrent creates
  - choice: Parse price strings with decimal detection
    rationale: Support both dollar format ($12.99) and cents (1299)
  - choice: Use pipe-separated values for array fields
    rationale: CSV standard approach for multi-value columns

metrics:
  tasks_completed: 2
  files_modified: 6
  tests_added: 6
  loc_added: ~170
---

# Phase 03 Plan 06: Bulk Product Operations Summary

**One-liner:** CSV import with Papa Parse streaming validation, bulk status change, and bulk delete for efficient product catalog management.

## What Was Built

Implemented bulk product operations to enable admins to manage large catalogs efficiently:

1. **CSV Upload Middleware** - Multer configuration with 10MB limit, MIME type validation, memory storage
2. **CSV Import Service** - Papa Parse with header transformation, per-row Zod validation, detailed error reporting
3. **Bulk Status Endpoint** - Update multiple products' status in one request (already existed from Plan 01)
4. **Bulk Delete Endpoint** - Delete multiple products at once (already existed from Plan 01)

## Implementation Details

### CSV Import Flow

1. **File Upload**: Multer middleware accepts CSV file (10MB max, MIME type checked)
2. **Parse**: Papa Parse converts to JSON with header normalization (lowercase, trim)
3. **Transform**: For each row:
   - Parse price strings: `$12.99` → `1299` cents, `1599` → `1599` (detect decimal)
   - Split pipe-separated values: `img1.jpg|img2.jpg` → `['img1.jpg', 'img2.jpg']`
   - Map CSV columns to ProductFormData structure
   - Add type-specific fields (weightedMeta, digitalMeta, bundleItems)
4. **Validate**: Zod productSchema validates each row with discriminated union
5. **Create**: Call existing `productService.create()` for valid rows
6. **Report**: Return `{ total, imported, failed, errors: [{ row, field, message }] }`

### Supported CSV Columns

**Common:**
- name, description, price, sku, productType, categoryId, brandId, status, images (pipe-separated)

**WEIGHTED:**
- unit, pricePerUnit, minWeight, maxWeight, stepWeight

**DIGITAL:**
- fileUrl, fileName, fileSize, fileFormat, maxDownloads, accessDuration

**BUNDLED:**
- bundleProductIds (pipe-separated), bundleQuantities (pipe-separated), bundleDiscounts (pipe-separated)

**VARIABLE:**
- Not supported in CSV import (too complex - requires variants with option combinations)

### Route Order

Routes placed before `/:id` param routes to avoid path conflicts:
1. `POST /import` - CSV import (admin only)
2. `PATCH /bulk/status` - Bulk status change (admin only)
3. `POST /bulk/delete` - Bulk delete (admin only)
4. `GET /slug/:slug` - Public product by slug
5. `GET /:id` - Public product by ID
6. ... (other CRUD operations)

## Tests

Added 6 test cases in `tests/products/csv-import.test.ts`:
1. Import valid CSV rows as products
2. Return error details for invalid rows
3. Handle mixed valid and invalid rows
4. Parse price strings to integer cents
5. Handle all product types except VARIABLE
6. Return total, imported, and failed counts

Note: Tests use mocked Prisma client from setup.ts. Mock configuration was refined to support the new import flow.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Missing dependency] Added missing Prisma mocks to test setup**
- **Found during:** Task 2 - Writing tests
- **Issue:** Tests failed because setup.ts didn't mock productTag, productCollection, category, brand
- **Fix:** Added missing mocks to tests/setup.ts with vi.fn() stubs
- **Files modified:** tests/setup.ts
- **Commit:** b47bffb

**2. [Rule 1 - Bug] Fixed TypeScript error on undefined firstError**
- **Found during:** Task 2 - TypeScript compilation
- **Issue:** firstError could be undefined, causing TS2048 error
- **Fix:** Added optional chaining `firstError?.path` and `firstError?.message || 'Validation error'`
- **Files modified:** apps/server/src/modules/product/product.service.ts
- **Commit:** b47bffb

## Verification Results

- TypeScript compilation: ✅ (only pre-existing errors on OptionValueInclude remain)
- CSV import endpoint: ✅ POST /api/products/import wired with middleware
- Bulk operations: ✅ Status and delete endpoints present from Plan 01
- Route order: ✅ Import route placed before /:id routes
- Dependencies installed: ✅ multer@2.1.1, papaparse@5.5.3

## Self-Check

Verifying claimed files and commits:

### Files Created/Modified
```bash
✅ apps/server/src/middleware/upload.middleware.ts - Created
✅ apps/server/src/modules/product/product.service.ts - Modified (importFromCsv added)
✅ apps/server/src/modules/product/product.controller.ts - Modified (importProducts added)
✅ apps/server/src/modules/product/product.routes.ts - Modified (import route added)
✅ tests/products/csv-import.test.ts - Modified (6 tests implemented)
✅ tests/setup.ts - Modified (mocks updated)
```

### Commits
```bash
✅ af2f0c0 - chore(03-06): add upload middleware with multer for CSV imports
✅ e3f435b - test(03-06): add failing tests for CSV import feature
✅ b47bffb - feat(03-06): implement CSV import with Papa Parse and validation
```

## Self-Check: PASSED

All claimed files exist, all commits are in git history, implementation matches plan objectives.
