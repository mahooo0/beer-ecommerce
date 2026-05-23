---
phase: 01-database-schema-design
plan: 01
subsystem: catalog-domain-schema
tags: [prisma, schema, catalog, postgres, jsonb]

dependency_graph:
  requires: []
  provides:
    - Core catalog domain models (Product, Category, Brand, Tag, Collection)
    - Product type discriminator system (SIMPLE, VARIABLE, WEIGHTED, DIGITAL, BUNDLED)
    - Variant option system (OptionGroup/OptionValue/VariantOption)
    - Category materialized path hierarchy
    - Dynamic attributes with JSONB and GIN indexing
  affects:
    - All future product CRUD operations
    - Search and filter implementations
    - Product page rendering
    - Inventory management
    - Order line items

tech_stack:
  added:
    - Prisma 6.8.0 schema with PostgreSQL provider
  patterns:
    - Type discriminator pattern (productType enum)
    - Materialized path for tree hierarchies
    - JSONB with GIN indexes for dynamic attributes
    - EAV pattern for variant options
    - Join tables for many-to-many relationships

key_files:
  created:
    - packages/db/prisma/schema.prisma
  modified: []

decisions:
  - desc: "Store prices as Int (cents) instead of Float"
    rationale: "Avoids floating-point precision issues in financial calculations"
    alternatives: ["Decimal type", "Float"]

  - desc: "Use JSONB with GIN index for product attributes"
    rationale: "Allows flexible category-specific attributes without schema changes, with performant filtering"
    alternatives: ["EAV tables", "HSTORE", "Rigid schema columns"]

  - desc: "Materialized path pattern for category tree"
    rationale: "Enables efficient ancestor/descendant queries without recursive CTEs"
    alternatives: ["Nested set", "Adjacency list", "Closure table"]

  - desc: "Separate meta tables for product types (DigitalMeta, WeightedMeta)"
    rationale: "Keeps Product table lean while supporting type-specific fields"
    alternatives: ["Polymorphic columns in Product", "Separate product tables per type"]

metrics:
  duration_minutes: 3
  completed_at: "2026-03-10T18:26:00Z"
  tasks_completed: 2
  files_created: 1
  files_modified: 0
  tests_added: 0
  commits: 1
---

# Phase 01 Plan 01: Product Catalog Schema Summary

**Complete Prisma schema for product catalog domain with type discriminator, variant system, and category tree**

## Overview

Implemented the foundational database schema for the entire product catalog domain. This includes Product model with support for five distinct product types (SIMPLE, VARIABLE, WEIGHTED, DIGITAL, BUNDLED) via enum discriminator and type-specific metadata tables, a flexible variant option system using EAV pattern, category hierarchy with materialized path, and organization models (Brand, Tag, Collection).

The schema uses modern PostgreSQL features including JSONB for dynamic attributes with GIN indexing for fast filtering, and stores all monetary values as integers (cents) to avoid floating-point precision issues.

## Tasks Completed

### Task 1: Define enums and Product model with type-specific meta tables
- **Status:** Complete ✓
- **Commit:** 677a11e
- **Files:** packages/db/prisma/schema.prisma

Added core enums (ProductType, ProductStatus, WeightUnit, AttributeType) and expanded Product model with:
- Type discriminator (productType) supporting all 5 product types
- Unique constraints on slug and sku fields
- JSONB attributes column with GIN index for category-specific filtering
- Integer pricing (cents) for compareAtPrice and price fields
- Relations to Category (Restrict), Brand (SetNull), variants, tags, collections
- Type-specific metadata models:
  - DigitalMeta: fileUrl, fileSize, maxDownloads, accessDuration
  - WeightedMeta: unit (KG/LB/OZ/G), pricePerUnit, min/max/step weight
  - BundleItem: junction table with quantity and discount per item

Indexes added: categoryId, brandId, sku, productType, status, attributes (GIN)

### Task 2: Define Category tree, variant system, and organization models
- **Status:** Complete ✓
- **Commit:** 677a11e (combined with Task 1)
- **Files:** packages/db/prisma/schema.prisma

Expanded Category model with materialized path pattern:
- path field (e.g., "/electronics/phones/smartphones")
- depth and position fields for hierarchy navigation
- Self-referential parent/children relations
- CategoryAttribute model for filterable attributes per category

Implemented variant option system (EAV pattern):
- OptionGroup: reusable option definitions (Size, Color, Material)
- OptionValue: specific values per group (Large, Red, #FF0000)
- VariantOption: junction table connecting ProductVariant to OptionValue
- ProductVariant: independent pricing, stock, images per variant

Added organization models:
- Brand: with slug, logo, website
- Tag/ProductTag: many-to-many with products
- Collection/ProductCollection: many-to-many with position ordering

All foreign keys explicitly indexed. All table names mapped to snake_case.

## Deviations from Plan

### Technical Constraint: Combined Task Commits

**Issue:** Tasks 1 and 2 were committed together instead of separately.

**Reason:** The Prisma schema is a single file that must be complete and valid as a unit. Task 1's Product model defines relations to Brand, Tag, and Collection models that are only defined in Task 2. Committing Task 1 alone would result in an invalid schema that fails Prisma validation due to undefined relation references.

**Resolution:** Implemented both tasks in a single schema write and commit. This follows the technical atomicity requirement (a valid Prisma schema) rather than the task atomicity boundary.

**Classification:** Not a deviation by protocol rules - this is the correct handling when technical constraints prevent task-by-task commits. Documented here for transparency.

## Verification Results

All automated verification passed:
- ✓ `prisma validate` passes with no errors
- ✓ ProductType enum contains all 5 values (SIMPLE, VARIABLE, WEIGHTED, DIGITAL, BUNDLED)
- ✓ Product.productType field exists with enum type
- ✓ Product.price stored as Int (cents)
- ✓ Product.attributes is Json with GIN index
- ✓ Product.slug and Product.sku have @unique constraints
- ✓ Category.path String, Category.depth Int, Category.position Int exist
- ✓ Category has @@index([path])
- ✓ DigitalMeta and WeightedMeta exist with @unique productId
- ✓ BundleItem has two Product relations (BundleProduct, BundledProduct)
- ✓ VariantOption join table connects ProductVariant to OptionValue
- ✓ Brand, Tag, Collection have @unique slug
- ✓ Many-to-many joins exist (ProductTag, ProductCollection)

## Success Criteria Met

- [x] Prisma schema validates without errors
- [x] All catalog-domain models defined with correct relations, indexes, and constraints
- [x] Product supports all 5 types via discriminator + meta tables
- [x] Category uses materialized path pattern
- [x] Variant system uses EAV pattern (OptionGroup/OptionValue/VariantOption)
- [x] JSONB attributes column has GIN index
- [x] All prices stored as Int (cents)
- [x] All IDs use cuid()
- [x] All tables mapped to snake_case names

## Key Artifacts

**packages/db/prisma/schema.prisma** (334 lines)
- 15 models total
- 4 enums
- Product model with 5 type support
- Complete variant option system
- Materialized path category tree
- All indexes and constraints defined

## Next Steps

1. **Plan 01-02:** Generate Prisma Client and create database initialization script
2. **Plan 01-03:** Create seed data for testing (categories, brands, sample products)
3. **Plan 01-04:** Document schema design patterns and relationships

## Dependencies

**Provided for:**
- Phase 02 (API Foundation) - Product CRUD endpoints
- Phase 03 (User & Auth) - User relations to cart, wishlist, orders
- Phase 04 (Search & Filters) - Meilisearch index configuration
- Phase 07 (Product Management) - Admin CRUD operations
- Phase 10 (Inventory) - Stock tracking models

**No external dependencies** - This is the foundational schema layer.

## Technical Notes

**Materialized Path Performance:**
- Ancestor queries: `WHERE path LIKE '/electronics%'`
- Descendant queries: `WHERE path LIKE '/electronics/phones/%'`
- Depth-based queries: `WHERE depth <= 2`
- All efficiently indexed via B-tree on path column

**JSONB Attributes Pattern:**
- Category-specific attributes stored as: `{"screen_size": "55 inch", "resolution": "4K"}`
- GIN index enables fast `@>` (contains) queries
- CategoryAttribute model defines valid keys and values per category

**Variant Option System:**
- A product with Size and Color options creates cartesian product of variants
- Each variant has unique SKU, independent pricing, and stock level
- VariantOption junction enables flexible option combinations

## Self-Check

### Created Files
```bash
FOUND: /Users/muhemmedibrahimov/work/ecom-template/packages/db/prisma/schema.prisma
```

### Commits
```bash
FOUND: 677a11e
```

## Self-Check: PASSED

All claimed files exist and commits are in git history.
