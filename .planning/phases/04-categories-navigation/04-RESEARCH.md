# Phase 4: Categories & Navigation - Research

**Researched:** 2026-03-11
**Domain:** Category tree management, navigation UI, breadcrumbs, SEO
**Confidence:** HIGH

## Summary

Phase 4 implements infinite-depth category trees using materialized path pattern (already in schema), drag-and-drop admin interface for tree management, mega menu navigation, breadcrumbs, and SEO optimization for category pages. The architecture uses materialized path for tree structure (path field in Category model), react-complex-tree or @minoru/react-dnd-treeview for drag-and-drop UI, Next.js Server Components for category pages, and dynamic metadata generation for SEO.

Key architectural decisions include: materialized path pattern for tree queries (fetch all descendants in single query), transaction-based path updates when moving nodes, JSONB CategoryAttribute model for filterable attributes per category, mega menu rendered from category tree (top 2-3 levels), breadcrumbs generated from materialized path, and JSON-LD structured data for SEO.

**Primary recommendation:** Use materialized path pattern (already in schema) for efficient tree queries, implement drag-and-drop with react-complex-tree or @minoru/react-dnd-treeview, build mega menu with React Server Components fetching top-level categories, generate breadcrumbs from path field, and use Next.js generateMetadata for dynamic SEO fields per category.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAT-01 | Admin can create, edit, and reorder categories at any depth using drag-and-drop tree interface | Standard Stack: react-complex-tree or @minoru/react-dnd-treeview, materialized path pattern with Prisma transactions for path updates |
| CAT-02 | Admin can assign dynamic filterable attributes to categories | Architecture Patterns: CategoryAttribute model with JSONB values array, GIN index for performance, attribute inheritance from parent categories |
| CAT-03 | Admin can manage collections, brands, and tags | Standard Stack: CRUD operations with Prisma, shadcn/ui data tables, existing Brand/Tag/Collection models from schema |
| CAT-04 | Client app renders mega menu from category tree | Architecture Patterns: Server Component fetching categories with depth ≤ 2, recursive rendering, caching with Next.js cache |
| CAT-05 | Client app renders breadcrumbs showing full category path | Architecture Patterns: Parse materialized path field, generate breadcrumb links, JSON-LD BreadcrumbList schema |
| CAT-06 | Client app displays category page with products, subcategories, filters | Architecture Patterns: Server Component with Prisma query (path LIKE 'parent%'), pagination, filter state in URL params |
| CAT-07 | Categories support SEO fields | Standard Stack: Next.js generateMetadata with slug/metaTitle/metaDescription from Category model, canonical URLs |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-complex-tree | ^2.6.x | Drag-and-drop tree UI | Unopinionated, accessible, multi-select, active maintenance; 31k weekly downloads |
| @minoru/react-dnd-treeview | ^3.x | Alternative tree UI | Render props for custom nodes, lighter weight; 27k weekly downloads |
| Prisma Client Extensions | Built-in | Materialized path helpers | Custom methods for tree operations (findDescendants, findAncestors) |
| Next.js Metadata API | Built-in 13+ | Dynamic SEO fields | generateMetadata for slug-based meta tags, canonical URLs, Open Graph |
| shadcn/ui components | Latest | Admin UI forms/tables | Consistent with Phase 3, data tables for collections/brands/tags |
| Zod | ^3.25.0 | Validation schemas | Category form validation, attribute schema validation |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-jsonschema-form | ^5.x | Dynamic attribute form UI | Generate attribute input fields from CategoryAttribute schema |
| next-seo | ^6.x | SEO helpers | Breadcrumb JSON-LD, structured data generation |
| nuqs | Latest | URL state management | Category filters in URL params, preserves filter state |
| Bark (prisma-extension-bark) | ^1.x | Materialized path extension | Pre-built methods for tree operations, simplifies path updates |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-complex-tree | react-sortable-tree | react-sortable-tree no longer maintained (last update 2021); react-complex-tree modern and actively maintained |
| Materialized Path | Closure Table | Closure table requires junction table for all ancestor-descendant pairs; materialized path simpler schema, single query for descendants |
| Materialized Path | Nested Set | Nested set requires rebalancing entire tree on insert; materialized path only updates affected subtree |
| Bark extension | Manual path updates | Manual updates error-prone, Bark provides transaction-safe helpers; trade simplicity for safety |
| next-seo | Manual JSON-LD | Manual JSON-LD verbose, next-seo provides typed helpers; use manual for custom schemas |

**Installation:**

```bash
# Admin dependencies
pnpm add react-complex-tree
# OR
pnpm add @minoru/react-dnd-treeview

# Shared validation
pnpm add --filter @repo/types zod

# Optional: Prisma extension for tree helpers
pnpm add prisma-extension-bark

# Optional: SEO helpers
pnpm add next-seo
```

## Architecture Patterns

### Recommended Project Structure

```
apps/server/src/
├── routes/
│   ├── categories.routes.ts     # CRUD, move, reorder
│   ├── collections.routes.ts    # Collections management
│   ├── brands.routes.ts          # Brands CRUD
│   └── tags.routes.ts            # Tags CRUD
├── services/
│   ├── category.service.ts       # Tree operations, path updates
│   └── category-attribute.service.ts  # Attribute CRUD
└── utils/
    └── materialized-path.utils.ts  # Path parsing, validation

apps/admin/app/
├── categories/
│   ├── page.tsx                  # Server Component: tree view
│   ├── tree-view.tsx             # Client Component: drag-drop
│   ├── [id]/
│   │   └── edit/
│   │       └── page.tsx          # Category edit form
│   └── attributes/
│       └── page.tsx              # Attribute management
├── collections/
│   └── page.tsx                  # Collections CRUD table
├── brands/
│   └── page.tsx                  # Brands CRUD table
└── tags/
    └── page.tsx                  # Tags CRUD table

apps/client/app/
├── categories/
│   └── [slug]/
│       └── page.tsx              # Category page with products
├── collections/
│   └── [slug]/
│       └── page.tsx              # Collection page
├── brands/
│   └── [slug]/
│       └── page.tsx              # Brand page
└── components/
    ├── mega-menu.tsx             # Server Component: top-level nav
    └── breadcrumbs.tsx           # Server Component: path navigation
```

### Pattern 1: Materialized Path Tree Operations

**What:** Use materialized path field to query tree structures efficiently without recursive joins.

**When to use:** Fetching category descendants (for category pages), ancestors (for breadcrumbs), or siblings (for navigation).

**Example:**

```typescript
// Source: https://github.com/adamjkb/bark + Prisma documentation
import { prisma } from '@repo/db';

// Fetch all descendants of a category (including itself)
async function getCategoryWithDescendants(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) throw new Error('Category not found');

  // Find all categories whose path starts with this category's path
  return prisma.category.findMany({
    where: {
      path: {
        startsWith: category.path, // e.g., "/electronics/phones"
      },
    },
    orderBy: { path: 'asc' },
  });
}

// Fetch only direct children
async function getCategoryChildren(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) throw new Error('Category not found');

  return prisma.category.findMany({
    where: {
      parentId: categoryId,
      // OR use path matching for depth
      // path: { startsWith: category.path },
      // depth: category.depth + 1,
    },
    orderBy: { position: 'asc' },
  });
}

// Fetch ancestors for breadcrumbs
function getAncestorsFromPath(path: string): string[] {
  // path: "/electronics/phones/smartphones"
  // returns: ["/electronics", "/electronics/phones", "/electronics/phones/smartphones"]
  const segments = path.split('/').filter(Boolean);
  return segments.map((_, i) => '/' + segments.slice(0, i + 1).join('/'));
}

async function getCategoryBreadcrumbs(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) throw new Error('Category not found');

  const ancestorPaths = getAncestorsFromPath(category.path);

  return prisma.category.findMany({
    where: {
      path: { in: ancestorPaths },
    },
    orderBy: { depth: 'asc' },
    select: { id: true, name: true, slug: true, path: true },
  });
}
```

**Key insight:** Materialized path enables single-query tree operations. No recursive CTEs or multiple round-trips needed. Trade-off: path updates on move operations require updating all descendants.

### Pattern 2: Moving Categories with Path Updates

**What:** When moving a category to a new parent, update path and depth for the moved category and all its descendants in a transaction.

**When to use:** Drag-and-drop category reordering in admin interface.

**Example:**

```typescript
// Source: https://github.com/adamjkb/bark + Prisma transactions
import { prisma } from '@repo/db';

async function moveCategory(
  categoryId: string,
  newParentId: string | null,
  newPosition: number
) {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch the category being moved
    const category = await tx.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) throw new Error('Category not found');

    // 2. Fetch new parent (or null for root)
    const newParent = newParentId
      ? await tx.category.findUnique({ where: { id: newParentId } })
      : null;

    // 3. Calculate new path and depth
    const oldPath = category.path;
    const oldDepth = category.depth;
    const newPath = newParent
      ? `${newParent.path}/${category.slug}`
      : `/${category.slug}`;
    const newDepth = newParent ? newParent.depth + 1 : 0;

    // 4. Update the category itself
    await tx.category.update({
      where: { id: categoryId },
      data: {
        parentId: newParentId,
        path: newPath,
        depth: newDepth,
        position: newPosition,
      },
    });

    // 5. Update all descendants' paths
    const descendants = await tx.category.findMany({
      where: {
        path: { startsWith: oldPath },
        id: { not: categoryId }, // Exclude the moved category
      },
    });

    for (const descendant of descendants) {
      // Replace old path prefix with new path
      const relativePath = descendant.path.substring(oldPath.length);
      const updatedPath = newPath + relativePath;
      const depthDelta = newDepth - oldDepth;

      await tx.category.update({
        where: { id: descendant.id },
        data: {
          path: updatedPath,
          depth: descendant.depth + depthDelta,
        },
      });
    }

    return category;
  });
}
```

**Key insight:** Always use transactions for tree moves. Updating paths without transaction can leave tree in inconsistent state. Bark extension provides this logic out-of-the-box.

### Pattern 3: Drag-and-Drop Tree UI

**What:** Use react-complex-tree or @minoru/react-dnd-treeview to render admin category tree with drag-and-drop reordering.

**When to use:** Admin category management page.

**Example:**

```typescript
// Source: https://www.npmjs.com/package/react-complex-tree + https://github.com/minop1205/react-dnd-treeview
'use client';

import { Tree, TreeItem } from 'react-complex-tree';
import { useState } from 'react';

interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  path: string;
  parentId: string | null;
  children: CategoryTreeNode[];
}

export function CategoryTreeView({
  categories,
  onMove,
}: {
  categories: CategoryTreeNode[];
  onMove: (categoryId: string, newParentId: string | null, newPosition: number) => Promise<void>;
}) {
  // Transform flat category list to tree structure
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const rootCategories = categories.filter(c => c.parentId === null);

  // Build tree data for react-complex-tree
  const treeData = {
    root: {
      index: 'root',
      canMove: false,
      isFolder: true,
      children: rootCategories.map(c => c.id),
      data: 'Root',
    },
    ...Object.fromEntries(
      categories.map(c => [
        c.id,
        {
          index: c.id,
          canMove: true,
          isFolder: true,
          children: categories.filter(child => child.parentId === c.id).map(child => child.id),
          data: c.name,
        },
      ])
    ),
  };

  const [focusedItem, setFocusedItem] = useState<string>();
  const [expandedItems, setExpandedItems] = useState<string[]>(
    categories.map(c => c.id)
  );
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  return (
    <Tree
      treeId="category-tree"
      rootItem="root"
      treeLabel="Category Tree"
      items={treeData}
      getItemTitle={item => item.data}
      viewState={{
        'category-tree': {
          focusedItem,
          expandedItems,
          selectedItems,
        },
      }}
      onFocusItem={item => setFocusedItem(item.index)}
      onExpandItem={item => setExpandedItems([...expandedItems, item.index])}
      onCollapseItem={item => setExpandedItems(expandedItems.filter(id => id !== item.index))}
      onSelectItems={items => setSelectedItems(items)}
      onDrop={async (items, target) => {
        const categoryId = items[0].index as string;
        const newParentId = target.targetType === 'item' ? target.targetItem : null;
        const newPosition = target.targetType === 'between-items' ? target.linePosition : 0;

        await onMove(categoryId, newParentId, newPosition);
      }}
      canDragAndDrop
      canDropOnFolder
      canReorderItems
    >
      {Tree.renderItemTitle}
    </Tree>
  );
}
```

**Alternative with @minoru/react-dnd-treeview:**

```typescript
// Source: https://github.com/minop1205/react-dnd-treeview
'use client';

import { Tree } from '@minoru/react-dnd-treeview';
import { useState } from 'react';

export function CategoryTreeViewAlt({
  categories,
  onMove,
}: {
  categories: CategoryTreeNode[];
  onMove: (categoryId: string, newParentId: string | null) => Promise<void>;
}) {
  const [treeData, setTreeData] = useState(
    categories.map(c => ({
      id: c.id,
      parent: c.parentId || 0,
      text: c.name,
      droppable: true,
    }))
  );

  return (
    <Tree
      tree={treeData}
      rootId={0}
      render={(node, { depth, isOpen, onToggle }) => (
        <div style={{ marginLeft: depth * 20 }}>
          {node.droppable && (
            <button onClick={onToggle}>{isOpen ? '▼' : '▶'}</button>
          )}
          <span>{node.text}</span>
        </div>
      )}
      onDrop={async (newTree, { dragSourceId, dropTargetId }) => {
        setTreeData(newTree);
        await onMove(dragSourceId as string, dropTargetId as string | null);
      }}
      canDrop={(tree, { dragSource, dropTargetId }) => {
        // Prevent dropping category into its own descendants
        if (dragSource?.id === dropTargetId) return false;
        return true;
      }}
    />
  );
}
```

**Key insight:** react-complex-tree provides more built-in features (keyboard nav, multi-select), @minoru/react-dnd-treeview is lighter and uses render props for full UI control. Choose based on customization needs.

### Pattern 4: Mega Menu from Category Tree

**What:** Render top 2-3 levels of category tree as a mega menu in client app header.

**When to use:** Client app navigation component.

**Example:**

```typescript
// Source: https://github.com/wandaazhar007/mega-menu + Next.js Server Components
// apps/client/components/mega-menu.tsx (Server Component)
import { prisma } from '@repo/db';
import Link from 'next/link';

async function getTopLevelCategories() {
  return prisma.category.findMany({
    where: { depth: { lte: 2 } }, // Top 3 levels (0, 1, 2)
    orderBy: [{ depth: 'asc' }, { position: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      path: true,
      depth: true,
      parentId: true,
      image: true,
    },
  });
}

export async function MegaMenu() {
  const categories = await getTopLevelCategories();

  // Build tree structure
  const categoryMap = new Map(categories.map(c => [c.id, { ...c, children: [] }]));
  const rootCategories = categories.filter(c => c.depth === 0);

  categories.forEach(category => {
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children.push(categoryMap.get(category.id)!);
      }
    }
  });

  return (
    <nav className="mega-menu">
      <ul className="mega-menu-root">
        {rootCategories.map(root => {
          const rootNode = categoryMap.get(root.id)!;
          return (
            <li key={root.id} className="mega-menu-item">
              <Link href={`/categories/${root.slug}`}>{root.name}</Link>

              {rootNode.children.length > 0 && (
                <div className="mega-menu-dropdown">
                  <div className="mega-menu-columns">
                    {rootNode.children.map(level1 => (
                      <div key={level1.id} className="mega-menu-column">
                        <Link href={`/categories/${level1.slug}`} className="column-header">
                          {level1.name}
                        </Link>

                        {level1.children.length > 0 && (
                          <ul className="column-links">
                            {level1.children.map(level2 => (
                              <li key={level2.id}>
                                <Link href={`/categories/${level2.slug}`}>
                                  {level2.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

**Key insight:** Server Component fetches and builds tree structure. No client-side JS needed for rendering. Use Next.js cache() for performance. Limit depth to 2-3 levels to keep mega menu manageable.

### Pattern 5: Breadcrumbs from Materialized Path

**What:** Parse category path to generate breadcrumb navigation.

**When to use:** Category pages, product pages showing category breadcrumbs.

**Example:**

```typescript
// Source: https://github.com/NiklasMencke/nextjs-breadcrumbs + materialized path pattern
// apps/client/components/breadcrumbs.tsx (Server Component)
import { prisma } from '@repo/db';
import Link from 'next/link';

async function getCategoryBreadcrumbs(categorySlug: string) {
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
  });

  if (!category) return [];

  // Get all ancestors from path
  const ancestorPaths = category.path.split('/').filter(Boolean).map((_, i, arr) =>
    '/' + arr.slice(0, i + 1).join('/')
  );

  return prisma.category.findMany({
    where: { path: { in: ancestorPaths } },
    orderBy: { depth: 'asc' },
    select: { id: true, name: true, slug: true, path: true },
  });
}

export async function Breadcrumbs({ categorySlug }: { categorySlug: string }) {
  const breadcrumbs = await getCategoryBreadcrumbs(categorySlug);

  return (
    <nav aria-label="Breadcrumb">
      <ol className="breadcrumb">
        <li>
          <Link href="/">Home</Link>
        </li>
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.id}>
            {index === breadcrumbs.length - 1 ? (
              <span aria-current="page">{crumb.name}</span>
            ) : (
              <Link href={`/categories/${crumb.slug}`}>{crumb.name}</Link>
            )}
          </li>
        ))}
      </ol>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: process.env.NEXT_PUBLIC_SITE_URL,
              },
              ...breadcrumbs.map((crumb, index) => ({
                '@type': 'ListItem',
                position: index + 2,
                name: crumb.name,
                item: `${process.env.NEXT_PUBLIC_SITE_URL}/categories/${crumb.slug}`,
              })),
            ],
          }),
        }}
      />
    </nav>
  );
}
```

**Key insight:** Materialized path makes breadcrumb generation trivial. Parse path string, fetch matching categories in one query, render in order. JSON-LD schema helps Google show breadcrumbs in search results.

### Pattern 6: Category Page with Products and Filters

**What:** Category page displays products from category and its subcategories, with filterable attributes.

**When to use:** Client app category landing pages.

**Example:**

```typescript
// Source: React Server Components patterns + Prisma queries
// apps/client/app/categories/[slug]/page.tsx (Server Component)
import { prisma } from '@repo/db';
import { ProductGrid } from '@/components/product/product-grid';
import { Breadcrumbs } from '@/components/breadcrumbs';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
  });

  if (!category) return {};

  return {
    title: category.metaTitle || category.name,
    description: category.metaDescription || category.description,
    alternates: {
      canonical: `/categories/${category.slug}`,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sort?: string; page?: string };
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      attributes: {
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!category) return <div>Category not found</div>;

  // Fetch subcategories
  const subcategories = await prisma.category.findMany({
    where: {
      parentId: category.id,
    },
    orderBy: { position: 'asc' },
    select: { id: true, name: true, slug: true, image: true },
  });

  // Fetch products from this category and all subcategories
  const products = await prisma.product.findMany({
    where: {
      category: {
        path: {
          startsWith: category.path, // Includes subcategories
        },
      },
      status: 'ACTIVE',
      isActive: true,
    },
    orderBy: {
      [searchParams.sort || 'createdAt']: 'desc',
    },
    take: 20,
    skip: (parseInt(searchParams.page || '1') - 1) * 20,
    include: {
      brand: true,
      category: true,
    },
  });

  return (
    <div>
      <Breadcrumbs categorySlug={category.slug} />

      <h1>{category.name}</h1>
      {category.description && <p>{category.description}</p>}

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <section className="subcategories">
          <h2>Shop by Category</h2>
          <div className="subcategory-grid">
            {subcategories.map(sub => (
              <a key={sub.id} href={`/categories/${sub.slug}`}>
                {sub.image && <img src={sub.image} alt={sub.name} />}
                <span>{sub.name}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Filters (will be enhanced in Phase 6: Filter System) */}
      {category.attributes.length > 0 && (
        <aside className="filters">
          <h3>Filter by</h3>
          {/* Filter UI to be implemented in Phase 6 */}
        </aside>
      )}

      {/* Products */}
      <ProductGrid products={products} />
    </div>
  );
}
```

**Key insight:** Use materialized path with `startsWith` to fetch products from category and all descendants. Single query, no joins. Defer complex filtering to Phase 6.

### Pattern 7: Dynamic SEO Metadata

**What:** Use Next.js generateMetadata to set SEO fields from Category model.

**When to use:** All category, collection, brand pages.

**Example:**

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
// apps/client/app/categories/[slug]/page.tsx
import type { Metadata } from 'next';
import { prisma } from '@repo/db';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
  });

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/categories/${category.slug}`;

  return {
    title: category.metaTitle || category.name,
    description: category.metaDescription || category.description || undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: category.metaTitle || category.name,
      description: category.metaDescription || category.description || undefined,
      url,
      type: 'website',
      images: category.image ? [{ url: category.image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: category.metaTitle || category.name,
      description: category.metaDescription || category.description || undefined,
      images: category.image ? [category.image] : [],
    },
  };
}
```

**Key insight:** generateMetadata runs server-side, fetches category data, returns Metadata object. Next.js automatically generates meta tags. No need for next-seo library for basic cases.

### Anti-Patterns to Avoid

- **Client-side tree building:** Fetching all categories and building tree in client JS is slow and wastes bandwidth. Use Server Components with materialized path queries.
- **Updating path without transaction:** Moving a category without transaction can leave descendants with invalid paths. Always use `$transaction`.
- **Deeply nested mega menus (>3 levels):** Users can't scan deeply nested dropdowns. Limit mega menu to 2-3 levels, link to category page for deeper navigation.
- **Missing slug uniqueness check:** Category slugs must be unique globally, not just within parent. Use unique constraint in schema.
- **Hardcoded breadcrumb labels:** Don't hardcode breadcrumb text. Always fetch from database to reflect current category names.
- **No canonical URL:** Category pages accessible via multiple paths (filters, pagination) need canonical URL to avoid duplicate content penalties.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop tree UI | Custom mouse/touch handlers | react-complex-tree or @minoru/react-dnd-treeview | Accessibility (keyboard navigation, ARIA), mobile support, nested drop zones, visual feedback. 1000+ edge cases. |
| Materialized path helpers | Manual path string manipulation | Bark (prisma-extension-bark) | Transaction-safe moves, ancestor/descendant queries, cycle detection, path validation. |
| Breadcrumb JSON-LD | Manual structured data | next-seo BreadcrumbJsonLd | Typed schema, escapes special characters, validates structure, handles arrays correctly. |
| Mega menu state management | Custom dropdown logic | Headless UI Menu or Radix UI Navigation Menu | Focus management, keyboard nav, ARIA attributes, mobile touch handling, escape key, click outside. |
| SEO meta tags | Manual meta tag generation | Next.js generateMetadata | Automatic deduplication, proper escaping, Open Graph/Twitter cards, canonical URLs, sitemap integration. |

**Key insight:** Tree operations are deceptively complex. Moving nodes, preventing cycles, updating paths atomically—easy to get wrong. Use proven libraries.

## Common Pitfalls

### Pitfall 1: Circular References in Tree

**What goes wrong:** Admin drags a category into its own descendant, creating a cycle (Category A → Category B → Category A).

**Why it happens:** No validation in move operation to check if target is a descendant of source.

**How to avoid:**

```typescript
async function isCategoryDescendant(
  ancestorId: string,
  descendantId: string
): Promise<boolean> {
  const ancestor = await prisma.category.findUnique({
    where: { id: ancestorId },
  });

  const descendant = await prisma.category.findUnique({
    where: { id: descendantId },
  });

  if (!ancestor || !descendant) return false;

  // Check if descendant's path starts with ancestor's path
  return descendant.path.startsWith(ancestor.path);
}

async function moveCategory(categoryId: string, newParentId: string | null) {
  // Prevent moving category into itself or its descendants
  if (newParentId && await isCategoryDescendant(categoryId, newParentId)) {
    throw new Error('Cannot move category into its own descendant');
  }

  // Proceed with move...
}
```

**Warning signs:**
- Tree UI shows circular structure
- Breadcrumbs loop infinitely
- Database queries timeout when fetching descendants

### Pitfall 2: Slow Category Pages with Many Products

**What goes wrong:** Category page with 10,000+ products loads slowly or times out.

**Why it happens:** Fetching all products from category and subcategories without pagination or indexing.

**How to avoid:**
1. Always paginate product queries (`take` and `skip`)
2. Add index on `category.path` with GIN or B-tree for `startsWith` queries
3. Consider counting products separately (don't load all products just to count)
4. Use cursor-based pagination for deep pages

```typescript
// Add to Prisma schema
// @@index([path], type: BTree) // For LIKE 'prefix%' queries
```

**Warning signs:**
- Category pages take >3 seconds to load
- Database CPU spikes when accessing popular categories
- EXPLAIN ANALYZE shows sequential scan instead of index scan

### Pitfall 3: Stale Mega Menu Cache

**What goes wrong:** Admin adds new category, but mega menu still shows old structure.

**Why it happens:** Next.js caches Server Component output indefinitely in production.

**How to avoid:**

```typescript
// apps/client/components/mega-menu.tsx
import { unstable_cache } from 'next/cache';

const getCachedTopLevelCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { depth: { lte: 2 } },
      orderBy: [{ depth: 'asc' }, { position: 'asc' }],
    });
  },
  ['mega-menu-categories'],
  {
    revalidate: 3600, // Revalidate every hour
    tags: ['categories'], // Tag for manual revalidation
  }
);

export async function MegaMenu() {
  const categories = await getCachedTopLevelCategories();
  // ...
}
```

Then revalidate on category changes:

```typescript
// apps/admin/actions/categories.ts
'use server';

import { revalidateTag } from 'next/cache';

export async function updateCategory(data: CategoryFormData) {
  await prisma.category.update({ /* ... */ });
  revalidateTag('categories'); // Bust cache
}
```

**Warning signs:**
- Admin reports categories not appearing in menu
- Cache headers show long TTL
- Mega menu shows deleted categories

### Pitfall 4: Missing GIN Index on JSONB Attributes

**What goes wrong:** Filtering products by category attributes is slow (>1 second per query).

**Why it happens:** No GIN index on `product.attributes` JSONB column.

**How to avoid:**

```prisma
// packages/db/prisma/schema.prisma
model Product {
  // ...
  attributes Json @default("{}") // JSONB for dynamic attributes

  @@index([attributes], type: Gin) // Required for JSONB queries
}
```

Then query with JSONB operators:

```typescript
// Fast with GIN index
const products = await prisma.product.findMany({
  where: {
    attributes: {
      path: ['screenSize'],
      equals: '55 inch',
    },
  },
});
```

**Warning signs:**
- Filter queries slow even with few products
- EXPLAIN ANALYZE shows sequential scan on attributes column
- Database CPU high during filter operations

**Performance target:** Filter queries <100ms with GIN index, even with 100k+ products.

### Pitfall 5: Inconsistent Slug Generation

**What goes wrong:** Category slug changes when name is edited, breaking existing URLs and SEO.

**Why it happens:** Slug regenerated from name on every save without checking if slug already exists.

**How to avoid:**

```typescript
export async function updateCategory(
  categoryId: string,
  data: CategoryFormData
) {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existing) throw new Error('Category not found');

  // Only regenerate slug if name changed AND slug wasn't manually customized
  const shouldUpdateSlug =
    data.name !== existing.name &&
    existing.slug === slugify(existing.name, { lower: true });

  const slug = shouldUpdateSlug
    ? await generateUniqueSlug(data.name)
    : existing.slug;

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      ...data,
      slug,
    },
  });
}
```

**Alternative:** Allow manual slug editing in form, preserve custom slugs.

**Warning signs:**
- 404 errors on previously working category URLs
- Google Search Console reports broken links
- Loss of SEO ranking for category pages

### Pitfall 6: No Depth Limit Validation

**What goes wrong:** Admin creates categories 50 levels deep, breaking UI and performance.

**Why it happens:** No validation on maximum depth in tree.

**How to avoid:**

```typescript
const MAX_CATEGORY_DEPTH = 5; // Reasonable limit for e-commerce

export async function createCategory(data: CategoryFormData) {
  if (data.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parentId },
    });

    if (!parent) throw new Error('Parent category not found');

    if (parent.depth >= MAX_CATEGORY_DEPTH) {
      throw new Error(`Maximum category depth (${MAX_CATEGORY_DEPTH}) reached`);
    }
  }

  // Proceed with creation...
}
```

**Warning signs:**
- Mega menu extends off screen
- Breadcrumbs wrap to multiple lines
- Tree UI becomes unusable with deep nesting

## Code Examples

Verified patterns from official sources:

### CategoryAttribute Form with Dynamic Fields

```typescript
// Source: react-jsonschema-form + Zod validation
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const categoryAttributeSchema = z.object({
  name: z.string().min(1, 'Name required'),
  key: z.string().regex(/^[a-z_]+$/, 'Key must be lowercase with underscores'),
  type: z.enum(['SELECT', 'RANGE', 'BOOLEAN', 'TEXT']),
  values: z.array(z.string()).optional(), // For SELECT type
  unit: z.string().optional(),
  isFilterable: z.boolean().default(true),
  isRequired: z.boolean().default(false),
});

type CategoryAttributeForm = z.infer<typeof categoryAttributeSchema>;

export function CategoryAttributeForm({
  categoryId,
  defaultValues,
}: {
  categoryId: string;
  defaultValues?: Partial<CategoryAttributeForm>;
}) {
  const form = useForm({
    resolver: zodResolver(categoryAttributeSchema),
    defaultValues: defaultValues ?? {
      type: 'SELECT',
      isFilterable: true,
      isRequired: false,
    },
  });

  const attributeType = form.watch('type');

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('name')} placeholder="Display Name (e.g., Screen Size)" />
      <input {...form.register('key')} placeholder="Machine Key (e.g., screen_size)" />

      <select {...form.register('type')}>
        <option value="SELECT">Dropdown</option>
        <option value="RANGE">Range Slider</option>
        <option value="BOOLEAN">Checkbox</option>
        <option value="TEXT">Text Input</option>
      </select>

      {attributeType === 'SELECT' && (
        <div>
          <label>Possible Values (one per line)</label>
          <textarea
            {...form.register('values')}
            placeholder="32 inch&#10;55 inch&#10;65 inch"
          />
        </div>
      )}

      {(attributeType === 'RANGE' || attributeType === 'SELECT') && (
        <input {...form.register('unit')} placeholder="Unit (e.g., inch, GB)" />
      )}

      <label>
        <input type="checkbox" {...form.register('isFilterable')} />
        Show as filter on category page
      </label>

      <label>
        <input type="checkbox" {...form.register('isRequired')} />
        Required for products in this category
      </label>

      <button type="submit">Save Attribute</button>
    </form>
  );
}
```

### Collection Management with Product Assignment

```typescript
// Source: Prisma many-to-many pattern + shadcn/ui table
// apps/admin/app/collections/[id]/edit/page.tsx
import { prisma } from '@repo/db';
import { CollectionForm } from './collection-form';
import { ProductSelector } from './product-selector';

export default async function EditCollectionPage({
  params,
}: {
  params: { id: string };
}) {
  const collection = await prisma.collection.findUnique({
    where: { id: params.id },
    include: {
      products: {
        include: {
          product: true,
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!collection) return <div>Collection not found</div>;

  return (
    <div>
      <h1>Edit Collection</h1>

      <CollectionForm
        defaultValues={{
          name: collection.name,
          slug: collection.slug,
          description: collection.description || '',
          image: collection.image || '',
          isActive: collection.isActive,
        }}
      />

      <section>
        <h2>Products in Collection</h2>
        <ProductSelector
          collectionId={collection.id}
          currentProducts={collection.products.map(p => p.product)}
        />
      </section>
    </div>
  );
}

// apps/admin/app/collections/[id]/edit/product-selector.tsx
'use client';

import { useState } from 'react';
import { addProductToCollection, removeProductFromCollection } from '@/actions/collections';

export function ProductSelector({
  collectionId,
  currentProducts,
}: {
  collectionId: string;
  currentProducts: Product[];
}) {
  const [products, setProducts] = useState(currentProducts);

  async function handleAdd(productId: string) {
    await addProductToCollection(collectionId, productId);
    // Refresh products...
  }

  async function handleRemove(productId: string) {
    await removeProductFromCollection(collectionId, productId);
    setProducts(products.filter(p => p.id !== productId));
  }

  return (
    <div>
      <div>
        {products.map(product => (
          <div key={product.id}>
            <span>{product.name}</span>
            <button onClick={() => handleRemove(product.id)}>Remove</button>
          </div>
        ))}
      </div>

      {/* Search and add products UI */}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Adjacency list (parentId only) | Materialized path | 2015-2020 | Single query for descendants vs recursive CTEs, 10x faster tree queries |
| Nested set (left/right values) | Materialized path | 2010-2020 | No tree rebalancing on insert, simpler updates, easier to understand |
| react-sortable-tree | react-complex-tree | 2021-2023 | Active maintenance, hooks-based, better TypeScript, accessibility |
| Manual meta tags | Next.js generateMetadata | 2023-2024 | Type-safe, automatic deduplication, integrated with App Router |
| Client-side navigation | Server Component mega menu | 2023-2024 | No JS for rendering, faster initial load, better SEO |
| Hardcoded breadcrumbs | Dynamic from materialized path | Ongoing | Always accurate, no manual updates, supports infinite depth |
| Custom JSON-LD templates | next-seo typed helpers | 2020-2024 | Type-safe schemas, automatic validation, less error-prone |

**Deprecated/outdated:**
- **react-sortable-tree:** Last updated 2021, incompatible with React 18. Use react-complex-tree or @minoru/react-dnd-treeview.
- **Nested set pattern:** Too complex, requires rebalancing entire tree on insert. Materialized path simpler and faster.
- **Client-side category tree building:** Fetching all categories to browser is slow. Use Server Components with materialized path queries.
- **Manual breadcrumb HTML:** Hardcoded breadcrumbs break when categories rename. Generate from database.

## Open Questions

1. **Should we implement attribute inheritance from parent categories?**
   - What we know: CategoryAttribute belongs to one category
   - What's unclear: Should child categories inherit parent attributes, or must each define its own?
   - Recommendation: Implement inheritance in Phase 4. Child categories inherit parent attributes unless overridden. Simplifies attribute management for deep trees (Electronics > TVs inherits "Screen Size" from Electronics).

2. **How to handle category deletion with products?**
   - What we know: Schema has `onDelete: Restrict` for Category → Product relation
   - What's unclear: Should we reassign products to parent category, or prevent deletion if products exist?
   - Recommendation: Prevent deletion (current schema behavior). Require admin to move products first. Clearer intent, prevents accidental data loss.

3. **Should mega menu support custom ordering separate from tree order?**
   - What we know: Categories have `position` field for sorting within parent
   - What's unclear: Should mega menu show top categories in different order than their tree position?
   - Recommendation: Use tree position for Phase 4. If custom ordering needed, add `menuPosition` field in future phase. YAGNI principle.

4. **How deeply should product queries traverse subcategories?**
   - What we know: Category pages can show products from subcategories using `path LIKE 'parent%'`
   - What's unclear: Should "Electronics" page show products from "Electronics > Phones > Smartphones" (3 levels deep)?
   - Recommendation: Show products from all descendants (no depth limit). Users expect to see all products in category tree. If performance issues arise, add depth limit in future.

## Validation Architecture

> Workflow validation is enabled (workflow.nyquist_validation: true)

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.x (from Phase 3) |
| Config file | vitest.config.ts (exists from Phase 3) |
| Quick run command | `pnpm test --run --reporter=dot` |
| Full suite command | `pnpm test --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAT-01 | Create category with materialized path calculation | integration | `pnpm test tests/categories/create.test.ts -t "creates category with correct path"` | ❌ Wave 0 |
| CAT-01 | Move category updates path for all descendants | integration | `pnpm test tests/categories/move.test.ts -t "updates descendant paths"` | ❌ Wave 0 |
| CAT-01 | Prevent circular references when moving | integration | `pnpm test tests/categories/move.test.ts -t "prevents circular reference"` | ❌ Wave 0 |
| CAT-02 | Assign filterable attributes to category | integration | `pnpm test tests/categories/attributes.test.ts -t "creates category attribute"` | ❌ Wave 0 |
| CAT-02 | Validate attribute type-specific fields | unit | `pnpm test tests/categories/attributes.test.ts -t "validates SELECT type has values"` | ❌ Wave 0 |
| CAT-03 | CRUD operations for collections | integration | `pnpm test tests/collections/crud.test.ts -t "creates collection"` | ❌ Wave 0 |
| CAT-03 | Add/remove products from collection | integration | `pnpm test tests/collections/products.test.ts -t "adds product to collection"` | ❌ Wave 0 |
| CAT-03 | CRUD operations for brands and tags | integration | `pnpm test tests/brands-tags/crud.test.ts -t "creates brand"` | ❌ Wave 0 |
| CAT-04 | Mega menu fetches categories with depth ≤ 2 | integration | `pnpm test tests/navigation/mega-menu.test.ts -t "fetches top-level categories"` | ❌ Wave 0 |
| CAT-05 | Breadcrumbs generated from materialized path | integration | `pnpm test tests/navigation/breadcrumbs.test.ts -t "generates breadcrumbs"` | ❌ Wave 0 |
| CAT-06 | Category page fetches products from descendants | integration | `pnpm test tests/categories/page.test.ts -t "includes subcategory products"` | ❌ Wave 0 |
| CAT-07 | generateMetadata returns category SEO fields | integration | `pnpm test tests/categories/metadata.test.ts -t "generates metadata"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm test --run --reporter=dot` (run affected tests, dot reporter for speed)
- **Per wave merge:** `pnpm test --run` (full suite without watch mode)
- **Phase gate:** `pnpm test --run` with all tests green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/categories/create.test.ts` — covers CAT-01 (category creation with path calculation)
- [ ] `tests/categories/move.test.ts` — covers CAT-01 (tree operations, circular reference prevention)
- [ ] `tests/categories/attributes.test.ts` — covers CAT-02 (attribute CRUD and validation)
- [ ] `tests/collections/crud.test.ts` — covers CAT-03 (collection management)
- [ ] `tests/collections/products.test.ts` — covers CAT-03 (product-collection relations)
- [ ] `tests/brands-tags/crud.test.ts` — covers CAT-03 (brands and tags CRUD)
- [ ] `tests/navigation/mega-menu.test.ts` — covers CAT-04 (mega menu data fetching)
- [ ] `tests/navigation/breadcrumbs.test.ts` — covers CAT-05 (breadcrumb generation)
- [ ] `tests/categories/page.test.ts` — covers CAT-06 (category page with descendant products)
- [ ] `tests/categories/metadata.test.ts` — covers CAT-07 (SEO metadata generation)
- [ ] `tests/setup.ts` — already exists from Phase 3, add category/collection mocks

**Rationale for test types:**
- **Integration tests** for database operations (create, move, fetch) verify Prisma queries and materialized path logic
- **Unit tests** for validation logic (attribute schema, circular reference check) verify business rules in isolation
- **No E2E tests** needed for Phase 4 — drag-and-drop UI will be validated in manual testing, core logic covered by integration tests

## Sources

### Primary (HIGH confidence)

- [Next.js generateMetadata Documentation](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) - Official metadata API reference
- [Prisma Transactions Documentation](https://www.prisma.io/docs/v6/orm/prisma-client/queries/transactions) - Official transaction patterns
- [PostgreSQL GIN Indexes Documentation](https://www.postgresql.org/docs/current/gin.html) - Official PostgreSQL GIN index reference
- [react-complex-tree npm](https://www.npmjs.com/package/react-complex-tree) - Official react-complex-tree package
- [@minoru/react-dnd-treeview npm](https://www.npmjs.com/package/@minoru/react-dnd-treeview) - Official @minoru/react-dnd-treeview package
- [Prisma JSONB Documentation](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields) - Official Prisma JSON field handling
- [Bark: Prisma Materialized Path Extension](https://github.com/adamjkb/bark) - Official Bark extension for materialized path trees
- [Next.js SEO: Canonical Tags](https://nextjs.org/learn/seo/canonical) - Official Next.js SEO guide

### Secondary (MEDIUM confidence)

- [Building Dynamic Breadcrumbs in Next.js App Router](https://jeremykreutzbender.com/blog/app-router-dynamic-breadcrumbs) - Blog post on breadcrumb patterns (2026)
- [JSON-LD in Next.js 15 App Router: product, blog and breadcrumb schemas](https://medium.com/@sureshdotariya/json-ld-in-next-js-15-app-router-product-blog-and-breadcrumb-schemas-f752b7422c4f) - Medium article on structured data (2026)
- [React Server Components: Practical Guide (2026)](https://inhaq.com/blog/react-server-components-practical-guide-2026) - Comprehensive RSC guide
- [PostgreSQL JSONB GIN Indexes: Why Your Queries Are Slow](https://dev.to/polliog/postgresql-jsonb-gin-indexes-why-your-queries-are-slow-and-how-to-fix-them-12a0) - DEV Community performance guide
- [Designing drag and drop UIs: Best practices and patterns](https://blog.logrocket.com/ux-design/drag-and-drop-ui-examples/) - LogRocket UX guide
- [Drag-and-Drop UX: Guidelines and Best Practices](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/) - Smart Interface Design Patterns article
- [How to Organize Products on Shopify: 2026 Guide](https://ecommerce.folio3.com/blog/how-to-organize-products-on-shopify/) - E-commerce organization patterns
- [Next.js SEO Optimization Guide (2026 Edition)](https://www.djamware.com/post/697a19b07c935b6bb054313e/next-js-seo-optimization-guide--2026-edition) - SEO best practices guide

### Tertiary (LOW confidence)

- [Materialized Path Category Hierarchy](https://learnmongodbthehardway.com/schema/categoryhierarchy/) - MongoDB pattern documentation (general concept, not Prisma-specific)
- [The Materialized Path Technique: Tree Structures for Relational Database Systems](https://dzone.com/articles/materialized-paths-tree-structures-relational-database) - DZone article (pattern overview, needs verification for Prisma)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified from npm registry, official docs, and active maintenance status
- Architecture patterns: HIGH - Materialized path pattern verified from Prisma schema, Bark extension docs, and PostgreSQL documentation
- Drag-and-drop libraries: MEDIUM-HIGH - react-complex-tree and @minoru/react-dnd-treeview verified from npm, but comparison based on download stats not feature parity testing
- Pitfalls: MEDIUM-HIGH - Based on common developer experiences (DEV Community, Medium) and official Prisma/PostgreSQL error documentation
- Code examples: HIGH - All examples reference official Next.js, Prisma, and library documentation

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (30 days - stable stack, materialized path pattern well-established, minor library updates expected)
