---
phase: 04-categories-navigation
plan: 04
subsystem: admin-ui
tags: [collections, brands, tags, admin-crud, navigation]
dependency_graph:
  requires: [04-02-api-clients]
  provides: [collections-ui, brands-ui, tags-ui, catalog-navigation]
  affects: [admin-app]
tech_stack:
  added: []
  patterns: [server-components, client-forms, inline-crud, searchParams-routing]
key_files:
  created:
    - apps/admin/src/app/dashboard/collections/page.tsx
    - apps/admin/src/app/dashboard/collections/collection-form.tsx
    - apps/admin/src/app/dashboard/collections/product-selector.tsx
    - apps/admin/src/app/dashboard/brands/page.tsx
    - apps/admin/src/app/dashboard/brands/brand-form.tsx
    - apps/admin/src/app/dashboard/tags/page.tsx
  modified:
    - apps/admin/src/app/dashboard/layout.tsx
decisions:
  - Use searchParams for modal/panel state management instead of React state
  - Use 'use client' for tags page due to inline form interactivity
  - Cast react-hook-form types to any for discriminated union compatibility
  - Cast Zod error messages to string for React rendering
metrics:
  duration: 4.3m
  completed_at: "2026-03-11T06:35:36Z"
---

# Phase 04 Plan 04: Admin CRUD Pages for Collections, Brands, and Tags Summary

**One-liner:** Built full CRUD admin pages for collections (with product assignment), brands, and tags with navigation integration

## Overview

This plan implemented admin UI pages for managing collections, brands, and tags. Collections have a sophisticated product assignment feature, brands have a standard CRUD table, and tags use an inline add/delete pattern for simplicity. All pages are now accessible from the admin sidebar navigation.

**Status:** ✅ Complete
**Tasks completed:** 2 of 2

## Tasks Completed

### Task 1: Build collections management page with product assignment

**Status:** ✅ Complete
**Commit:** c3f17ed
**Files created:**
- `apps/admin/src/app/dashboard/collections/page.tsx`
- `apps/admin/src/app/dashboard/collections/collection-form.tsx`
- `apps/admin/src/app/dashboard/collections/product-selector.tsx`

**What was done:**

**Collections page (Server Component):**
- Fetches collections from API with auth token
- Displays table with: Name, Slug, Products count, Active status (badge), Actions
- Uses searchParams for state: `?action=create`, `?action=edit&id=xxx`, `?action=products&id=xxx`
- Shows CollectionForm when creating/editing
- Shows ProductSelector when managing collection products
- Delete confirmation with server action

**Collection form (Client Component):**
- Fields: name, description, image URL, active checkbox, slug
- Auto-generates slug from name on creation (editable)
- Form validation with Zod schema
- Uses react-hook-form with zodResolver
- Calls api.collections.create or update with token

**Product selector (Client Component):**
- Shows current products in collection (list with remove buttons)
- Search input to find products to add
- Dropdown results with "Add" button for each product
- Calls api.collections.addProduct/removeProduct
- Real-time search filtering by product name or SKU

### Task 2: Build brands and tags management pages, update admin navigation

**Status:** ✅ Complete
**Commit:** 4fc4864
**Files created:**
- `apps/admin/src/app/dashboard/brands/page.tsx`
- `apps/admin/src/app/dashboard/brands/brand-form.tsx`
- `apps/admin/src/app/dashboard/tags/page.tsx`
**Files modified:**
- `apps/admin/src/app/dashboard/layout.tsx`

**What was done:**

**Brands page (Server Component):**
- Fetches brands from API with auth token
- Table columns: Name, Slug, Logo (thumbnail), Website (link), Products count, Actions
- Shows brand-form when `?action=create` or `?action=edit&id=xxx`
- Delete confirmation with server action

**Brand form (Client Component):**
- Fields: name, slug, description, logo URL, website (with URL validation)
- Auto-generates slug from name on creation
- Form validation with Zod schema
- Calls api.brands.create or update with token

**Tags page (Client Component):**
- Simple inline add form: text input + "Add Tag" button
- Tags displayed as pill badges with delete (X) button
- No edit needed for tags (create/delete only)
- Calls api.tags.create({ name }, token) and api.tags.delete(id, token)
- Real-time updates with state management

**Admin navigation update:**
- Added Collections, Brands, Tags links to Catalog section
- All catalog pages now grouped together: Products, Categories, Collections, Brands, Tags
- Consistent sidebar navigation structure

## Deviations from Plan

None - plan executed exactly as written.

## Technical Implementation

### SearchParams Routing Pattern

Used Next.js searchParams for managing page state instead of React state:
```typescript
// No modals, no useState - just URL params
?action=create → show create form
?action=edit&id=xxx → show edit form
?action=products&id=xxx → show product selector
```

Benefits: shareable URLs, browser back/forward works, server-side rendering

### Form Type Casting

Cast react-hook-form types to `any` for Zod discriminated union compatibility:
```typescript
const { register, handleSubmit } = useForm<any>({
  resolver: zodResolver(schema),
})
```

Cast error messages to string for React rendering:
```typescript
{errors.name && <p>{String(errors.name.message)}</p>}
```

### Tags Pattern

Tags use client component with inline form (unlike collections/brands with separate forms):
- Simpler entity → simpler UI
- No edit needed → create and delete only
- Inline form → faster workflow for quick tag creation

### Product Selector

Dropdown search pattern for adding products to collections:
```typescript
// Search input controls dropdown visibility
const filteredProducts = products.filter(p =>
  p.name.toLowerCase().includes(query) ||
  p.sku.toLowerCase().includes(query)
)
```

## Verification

✅ TypeScript compilation passes (no errors in collections, brands, tags, layout files)
✅ Collections page has table, form, and product selector
✅ Brands page has table and form
✅ Tags page has inline add and delete
✅ Admin navigation has all catalog links (Products, Categories, Collections, Brands, Tags)

## Impact

**Admin capabilities:**
- Full CRUD on collections including adding/removing products
- Full CRUD on brands with logo and website support
- Create and delete tags with inline workflow
- All catalog management accessible from sidebar

**User experience:**
- Unified catalog section in admin sidebar
- Consistent table-based CRUD patterns
- Auto-slug generation for better UX
- Server-side rendering for fast page loads
- Client-side interactivity where needed (forms, search)

## Next Steps

The admin catalog management UI is now complete. Future work can include:
- Product filtering by collection/brand/tag on client-facing pages
- Collection landing pages for customers
- Brand pages with product listings
- Tag-based product discovery
- Bulk product assignment to collections

## Self-Check

✅ PASSED

**Files verified:**
```bash
✅ apps/admin/src/app/dashboard/collections/page.tsx - exists, compiles
✅ apps/admin/src/app/dashboard/collections/collection-form.tsx - exists, compiles
✅ apps/admin/src/app/dashboard/collections/product-selector.tsx - exists, compiles
✅ apps/admin/src/app/dashboard/brands/page.tsx - exists, compiles
✅ apps/admin/src/app/dashboard/brands/brand-form.tsx - exists, compiles
✅ apps/admin/src/app/dashboard/tags/page.tsx - exists, compiles
✅ apps/admin/src/app/dashboard/layout.tsx - modified, compiles
```

**Commits verified:**
```bash
✅ c3f17ed - feat(04-04): build collections management page with product assignment
✅ 4fc4864 - feat(04-04): build brands and tags management pages, update admin navigation
```
