---
phase: 03-product-catalog
plan: 03
subsystem: admin-ui
tags: [admin, products, data-table, tanstack, ui]
dependency_graph:
  requires: [03-01]
  provides: [admin-product-listing, product-table-ui, bulk-operations]
  affects: [admin-navigation, product-management-workflow]
tech_stack:
  added:
    - "@tanstack/react-table@8.21.3"
  patterns:
    - "TanStack Table for data tables"
    - "Server-side pagination with searchParams"
    - "Client-side sorting and filtering"
    - "Bulk operations with row selection"
    - "Type-safe column definitions"
key_files:
  created:
    - apps/admin/src/app/products/page.tsx
    - apps/admin/src/components/product/products-table.tsx
    - apps/admin/src/components/product/columns.tsx
    - apps/admin/src/components/product/product-status-badge.tsx
  modified:
    - apps/admin/src/lib/api.ts
    - apps/admin/package.json
decisions:
  - "Use TanStack Table for product listing UI - provides powerful data table features with TypeScript support"
  - "Server-side pagination for scalability - query params control page/limit"
  - "Client-side sorting/filtering for responsiveness - no server round-trip for column operations"
  - "Bulk operations via row selection - admins can update/delete multiple products at once"
  - "Token forwarding in fetcher - auth support for server-side API calls"
metrics:
  duration_minutes: 4.4
  completed_at: "2026-03-11T01:55:45Z"
  tasks_completed: 2
  files_modified: 5
  lines_added: 724
---

# Phase 03 Plan 03: Admin Product List Page Summary

Admin product listing interface with TanStack Table featuring sorting, filtering, search, pagination, status badges, and bulk operations.

## Completed Tasks

### Task 1: Install TanStack Table and expand admin API client
**Commit:** `bb4393d`
**Files:** apps/admin/package.json, apps/admin/src/lib/api.ts, apps/admin/src/components/product/product-status-badge.tsx

- Installed @tanstack/react-table@8.21.3 package
- Expanded products API client with full query param support (page, limit, status, productType, search, sortBy, sortOrder)
- Added products.updateStatus, bulkUpdateStatus, bulkDelete methods to API client
- Enhanced fetcher function with auth token forwarding (optional token parameter)
- Created ProductStatusBadge component with color-coded status display:
  - DRAFT: gray background and border
  - ACTIVE: green background and border
  - ARCHIVED: red background and border

### Task 2: Create admin products page with data table
**Commit:** `a45231e`
**Files:** apps/admin/src/components/product/columns.tsx, apps/admin/src/components/product/products-table.tsx, apps/admin/src/app/products/page.tsx

- Created TanStack Table column definitions (columns.tsx):
  - Checkbox column for row selection
  - Name column with product thumbnail (40x40px) and link to edit page
  - Product Type column with blue badge styling
  - Status column using ProductStatusBadge component
  - Price column formatted as currency ($XX.XX)
  - Created At column with readable date format
  - Actions column with Edit link
- Created ProductsTable client component (products-table.tsx):
  - Search input for filtering by product name
  - Status dropdown filter (DRAFT, ACTIVE, ARCHIVED, All)
  - Product Type dropdown filter (SIMPLE, VARIABLE, WEIGHTED, DIGITAL, BUNDLED, All)
  - Create Product button linking to /products/new
  - Sortable table headers with sort direction indicators (↑ ↓ ↕)
  - Row hover highlighting
  - Empty state message when no products found
  - Selected products count display
  - Bulk actions dropdown (Set to Active/Draft/Archived, Delete Selected)
  - Pagination controls (Previous, Page X of Y, Next)
  - Page size selector (10, 25, 50 per page)
- Created /products server page (page.tsx):
  - Parses searchParams for pagination, filters, search, and sorting
  - Fetches products via api.products.getAll with Clerk token
  - Displays product count in header
  - Error handling with user-friendly error messages
  - Passes data and pagination props to ProductsTable

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

**TypeScript Compilation:** ✓ No errors introduced by changes (pre-existing errors in unrelated files are out of scope)

**Test Suite:** ✓ No test regressions from changes (existing test failures in mock setup are pre-existing)

**Implementation Completeness:**
- ✓ TanStack Table installed and configured
- ✓ Column definitions include all required columns
- ✓ Sorting, filtering, and search implemented
- ✓ Pagination controls present and functional
- ✓ Bulk operations for status change and deletion
- ✓ Server-side data fetching with auth token
- ✓ Status badges display with correct colors
- ✓ Product thumbnails render with next/image
- ✓ Price formatting as currency (cents to dollars)
- ✓ Date formatting as readable format

## Implementation Notes

**Server-side vs Client-side Data Operations:**
- Pagination: Server-side (query params control page/limit)
- Sorting: Client-side (TanStack Table handles in-memory)
- Filtering: Client-side (TanStack Table handles in-memory)
- Search: Client-side (filters name column via TanStack Table)

This hybrid approach provides good UX for small-to-medium datasets while keeping the pagination scalable. For large catalogs, sorting/filtering could be moved server-side in a future iteration.

**Auth Token Handling:**
- Server components use Clerk's auth().getToken() to fetch token
- Token passed to api.products.getAll via optional token parameter
- Fetcher adds Authorization header when token present
- Client components would need to use useAuth() hook for token access

**Bulk Operations:**
- Row selection tracked via TanStack Table's rowSelection state
- Selected IDs extracted from table.getFilteredSelectedRowModel()
- Confirmation dialogs prevent accidental bulk deletes
- router.refresh() reloads page data after mutations
- Row selection cleared after successful operations

## Files Created

- `/apps/admin/src/app/products/page.tsx` - Server component for /products route
- `/apps/admin/src/components/product/products-table.tsx` - Client table component with TanStack Table
- `/apps/admin/src/components/product/columns.tsx` - Column definitions for product table
- `/apps/admin/src/components/product/product-status-badge.tsx` - Status badge component

## Files Modified

- `/apps/admin/src/lib/api.ts` - Expanded products API client with query params and bulk operations
- `/apps/admin/package.json` - Added @tanstack/react-table dependency

## What's Next

Plan 03-04 will create the product creation/edit form using the type-specific field components. This plan provides the listing UI that will link to that form.

## Self-Check

Verifying all claimed files and commits exist.

**Created files:**
- ✓ FOUND: apps/admin/src/app/products/page.tsx
- ✓ FOUND: apps/admin/src/components/product/products-table.tsx
- ✓ FOUND: apps/admin/src/components/product/columns.tsx
- ✓ FOUND: apps/admin/src/components/product/product-status-badge.tsx

**Modified files:**
- ✓ FOUND: apps/admin/src/lib/api.ts
- ✓ FOUND: apps/admin/package.json

**Commits:**
- ✓ FOUND: bb4393d (Task 1)
- ✓ FOUND: a45231e (Task 2)

## Self-Check: PASSED
