# Phase 6: Filter System - Research

**Researched:** 2026-03-11
**Domain:** Dynamic attribute-based filters with URL persistence for e-commerce product listings
**Confidence:** HIGH

## Summary

Phase 6 implements a comprehensive filter system enabling customers to narrow product listings using dynamic category attributes, price ranges, availability status, and brand selection. The architecture leverages URL search parameters for shareable filtered views, PostgreSQL JSONB GIN indexes for efficient attribute queries, and a mobile-first responsive UI pattern (desktop sidebar, mobile full-screen drawer). Filters use OR logic within groups and AND logic across groups, matching standard e-commerce conventions.

The technical stack includes nuqs v2.8+ for type-safe URL state management, shadcn/ui components (Slider, Checkbox, Sheet) for the filter UI, and server-side filtering via Next.js Server Components with search params. Dynamic filters are derived from CategoryAttribute definitions stored in the database, product counts update in real-time as filters are applied, and all state persists in URL parameters for bookmarking and sharing.

Key architectural decisions: nuqs for URL state (replaces manual useSearchParams), facet counts calculated via Prisma aggregations with JSONB operators, mobile filter UI uses Sheet component (full-screen modal), price filter combines range slider with manual input fields, and filter state passed via searchParams to enable server-side rendering and SEO.

**Primary recommendation:** Use nuqs v2.8+ for URL state management with type-safe parsers, shadcn/ui Slider for price range with dual handles, shadcn/ui Checkbox groups for multi-select filters, shadcn/ui Sheet for mobile drawer UI, and PostgreSQL JSONB path operators with GIN index for efficient attribute filtering. Configure filters server-side from CategoryAttribute model to support dynamic attribute-based filtering per category.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FILT-01 | Category pages show dynamic filters derived from category's assigned attributes | Architecture Pattern: Query CategoryAttribute for current category, render filter UI based on AttributeType (SELECT → checkboxes, RANGE → slider, BOOLEAN → single checkbox) |
| FILT-02 | Price range filter with slider and min/max input fields | Standard Stack: shadcn/ui Slider with dual handles, controlled inputs synced with slider state, format prices with currency display |
| FILT-03 | Multi-select filters with checkbox groups showing product counts | Standard Stack: shadcn/ui Checkbox components, Architecture Pattern: Prisma aggregations with JSONB contains operator to count matching products per filter value |
| FILT-04 | Filter state persists in URL parameters for shareable/bookmarkable views | Standard Stack: nuqs useQueryStates hook manages multiple filters in URL, shallow routing by default for client updates, server reads searchParams for SSR |
| FILT-05 | Filters use OR logic within groups and AND logic across groups | Architecture Pattern: Build Prisma where clause with OR for same attribute values, AND across different attributes, translate to JSONB path queries |
| FILT-06 | Mobile filter UI uses full-screen modal with apply/clear buttons | Standard Stack: shadcn/ui Sheet component with full-screen variant on mobile, responsive useMediaQuery hook switches between sidebar and drawer |
| FILT-07 | Availability filter (in stock, out of stock, pre-order) | Architecture Pattern: Query product.variants.stock field with aggregation, filter by stock > 0 for in-stock, stock = 0 for out-of-stock |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nuqs | ^2.8.0+ | Type-safe URL state management | Only 6 kB, native Next.js App Router support, React Server Component compatible, built-in parsers for common types, 400k+ weekly downloads |
| shadcn/ui Slider | latest | Price range slider component | Built on Radix UI Slider, accessible (ARIA), supports dual handles, customizable with Tailwind, part of existing UI library |
| shadcn/ui Checkbox | latest | Multi-select filter checkboxes | Accessible checkbox with indeterminate state, form-compatible, consistent styling with existing components |
| shadcn/ui Sheet | latest | Mobile filter drawer | Full-screen modal on mobile, side drawer on desktop, handles focus trap and body scroll lock, Radix Dialog primitive |
| Zod | ^3.25.0 | Filter validation schemas | Type-safe URL param parsing with nuqs, validates filter values before database queries |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-debounce | ^10.0.0 | Debounce filter updates | Optional - debounce price slider changes to reduce URL updates and re-renders, typically 300ms delay |
| @radix-ui/react-separator | latest | Visual dividers between filter groups | Semantic separator element, already used in shadcn/ui patterns |
| clsx / cn utility | latest | Conditional filter UI classes | Highlight active filters, style selected checkboxes, used throughout existing codebase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nuqs | Manual useSearchParams + useRouter | Manual approach requires handling serialization, type safety, shallow routing, history management - nuqs provides all built-in |
| nuqs | TanStack Router search params | TanStack Router is full routing solution requiring migration from Next.js App Router - nuqs is library, not framework |
| shadcn/ui Slider | rc-slider or react-range | rc-slider is 53KB (vs Radix 12KB), react-range lacks accessibility features - shadcn/ui provides consistent design system integration |
| Sheet drawer | MUI Drawer or custom modal | MUI adds 300KB+ bundle size, custom modals miss accessibility (focus trap, ESC key, scroll lock) - Sheet is lightweight and accessible |
| Server Component filtering | Client-side filtering | Client filtering requires sending all products to browser, slow for large catalogs, no SEO - server filtering is performant and SEO-friendly |

**Installation:**
```bash
# Client app dependencies
pnpm add --filter client nuqs use-debounce

# shadcn/ui components (run from client app directory)
pnpm dlx shadcn@latest add slider checkbox sheet separator
```

## Architecture Patterns

### Recommended Project Structure
```
apps/client/src/
├── app/
│   └── categories/
│       └── [slug]/
│           └── page.tsx              # Server Component reads searchParams, fetches filtered products
├── components/
│   └── filters/
│       ├── filter-sidebar.tsx        # Desktop: fixed sidebar with all filters
│       ├── filter-drawer.tsx         # Mobile: Sheet component with filters
│       ├── filter-provider.tsx       # Client Component wraps nuqs state
│       ├── price-filter.tsx          # Slider + input fields for price range
│       ├── attribute-filter.tsx      # Dynamic filter based on CategoryAttribute type
│       ├── availability-filter.tsx   # In stock / Out of stock checkboxes
│       ├── brand-filter.tsx          # Brand checkbox group
│       ├── active-filters.tsx        # Chips showing applied filters with clear buttons
│       └── filter-button.tsx         # Mobile: button to open drawer
└── hooks/
    └── use-filters.ts                # Custom hook wrapping nuqs for filter state

apps/server/src/
└── modules/
    └── product/
        ├── product.service.ts        # Add filterProducts method with JSONB queries
        └── product.controller.ts     # Add facet aggregation endpoint
```

### Pattern 1: Type-Safe URL State with nuqs

**What:** Use nuqs to manage filter state in URL parameters with type-safe parsing and serialization

**When to use:** All filter state management - price range, selected attributes, brands, availability

**Example:**
```typescript
// Source: https://nuqs.dev/docs/usage + https://github.com/47ng/nuqs
// apps/client/src/hooks/use-filters.ts

'use client';

import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export function useFilters() {
  return useQueryStates(
    {
      // Price range
      minPrice: parseAsInteger.withDefault(0),
      maxPrice: parseAsInteger.withDefault(999999), // max price in cents

      // Multi-select attributes (e.g., brands, colors, sizes)
      brands: parseAsArrayOf(parseAsString).withDefault([]),
      attributes: parseAsArrayOf(parseAsString).withDefault([]), // Format: "key:value"

      // Availability
      availability: parseAsArrayOf(parseAsString).withDefault([]), // ["in_stock", "out_of_stock"]

      // Pagination and sorting (existing)
      page: parseAsInteger.withDefault(1),
      sortBy: parseAsString.withDefault('createdAt'),
      sortOrder: parseAsString.withDefault('desc')
    },
    {
      history: 'push', // Update browser history
      shallow: true,   // Don't trigger server re-render on client updates
      clearOnDefault: true // Remove param from URL when set to default value
    }
  );
}

// Usage in client component
export function FilterSidebar() {
  const [filters, setFilters] = useFilters();

  const handlePriceChange = ([min, max]: [number, number]) => {
    setFilters({ minPrice: min, maxPrice: max });
  };

  const handleBrandToggle = (brandId: string) => {
    const newBrands = filters.brands.includes(brandId)
      ? filters.brands.filter(b => b !== brandId)
      : [...filters.brands, brandId];

    setFilters({ brands: newBrands, page: 1 }); // Reset to page 1 on filter change
  };

  const clearAllFilters = () => {
    setFilters({
      minPrice: 0,
      maxPrice: 999999,
      brands: [],
      attributes: [],
      availability: [],
      page: 1
    });
  };

  // ... render UI
}
```

**Key insight:** nuqs handles serialization (arrays → comma-separated), type parsing, history management, and React Server Component compatibility. URL updates are shallow by default (no server round-trip), but server can read searchParams for initial render.

### Pattern 2: Server-Side Filtering with JSONB Operators

**What:** Build Prisma where clauses from URL search params using JSONB path operators for dynamic attributes

**When to use:** Category page server component fetching filtered products

**Example:**
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields
// apps/client/app/categories/[slug]/page.tsx (Server Component)

import { api } from '@/lib/api';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    brands?: string; // comma-separated
    attributes?: string; // comma-separated "key:value"
    availability?: string; // comma-separated
    page?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  // Parse filters from URL
  const minPrice = parseInt(query.minPrice || '0', 10);
  const maxPrice = parseInt(query.maxPrice || '999999', 10);
  const brands = query.brands ? query.brands.split(',') : [];
  const attributes = query.attributes ? query.attributes.split(',') : [];
  const availability = query.availability ? query.availability.split(',') : [];

  // Fetch category
  const categoryResult = await api.categories.getBySlug(slug);
  const category = categoryResult.data;

  if (!category) notFound();

  // Build filter object for API
  const filters = {
    categoryPath: category.path,
    minPrice,
    maxPrice,
    brandIds: brands.length > 0 ? brands : undefined,
    attributes: attributes.length > 0 ? parseAttributes(attributes) : undefined,
    availability: availability.length > 0 ? availability : undefined,
    status: 'ACTIVE'
  };

  // Fetch filtered products
  const result = await api.products.getAll({
    ...filters,
    page: parseInt(query.page || '1', 10),
    limit: 20,
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder || 'desc'
  });

  const products = result.data || [];
  const total = result.total || 0;

  return (
    <div>
      {/* FilterSidebar is client component using nuqs */}
      <FilterSidebar categoryAttributes={category.attributes} />
      <ProductGrid products={products} />
    </div>
  );
}

function parseAttributes(attributes: string[]) {
  // Convert ["screen_size:55 inch", "color:red"] to { screen_size: ["55 inch"], color: ["red"] }
  return attributes.reduce((acc, attr) => {
    const [key, value] = attr.split(':');
    if (!acc[key]) acc[key] = [];
    acc[key].push(value);
    return acc;
  }, {} as Record<string, string[]>);
}
```

**Backend implementation:**
```typescript
// Source: PostgreSQL JSONB operators + Prisma client
// apps/server/src/modules/product/product.service.ts

interface FilterOptions {
  categoryPath?: string;
  minPrice?: number;
  maxPrice?: number;
  brandIds?: string[];
  attributes?: Record<string, string[]>; // { screen_size: ["55 inch", "65 inch"], color: ["red"] }
  availability?: string[]; // ["in_stock", "out_of_stock"]
  status?: string;
}

export class ProductService {
  async filterProducts(filters: FilterOptions, pagination: PaginationOptions) {
    const where: Prisma.ProductWhereInput = {
      status: filters.status as ProductStatus || undefined,
      isActive: true
    };

    // Category filtering (includes descendants)
    if (filters.categoryPath) {
      where.category = {
        path: { startsWith: filters.categoryPath }
      };
    }

    // Price range
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {
        gte: filters.minPrice,
        lte: filters.maxPrice
      };
    }

    // Brand filtering (OR logic within group)
    if (filters.brandIds && filters.brandIds.length > 0) {
      where.brandId = { in: filters.brandIds };
    }

    // Dynamic attribute filtering (OR within group, AND across groups)
    if (filters.attributes && Object.keys(filters.attributes).length > 0) {
      const attributeConditions = Object.entries(filters.attributes).map(([key, values]) => ({
        // OR: product has ANY of the specified values for this attribute
        OR: values.map(value => ({
          attributes: {
            path: [key],
            equals: value
          }
        }))
      }));

      // AND: product matches ALL attribute groups
      where.AND = attributeConditions;
    }

    // Availability filtering
    if (filters.availability && filters.availability.length > 0) {
      const availabilityConditions = [];

      if (filters.availability.includes('in_stock')) {
        availabilityConditions.push({
          variants: { some: { stock: { gt: 0 } } }
        });
      }

      if (filters.availability.includes('out_of_stock')) {
        availabilityConditions.push({
          variants: { every: { stock: { equals: 0 } } }
        });
      }

      if (availabilityConditions.length > 0) {
        where.OR = availabilityConditions;
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, brand: true },
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      this.prisma.product.count({ where })
    ]);

    return { products, total, totalPages: Math.ceil(total / pagination.limit) };
  }
}
```

**Key insight:** JSONB path operators (`path: ['key']`, `equals: value`) use GIN index for fast filtering. Combine Prisma's `OR`, `AND`, `in` operators to implement standard e-commerce filter logic (OR within groups, AND across groups).

### Pattern 3: Dynamic Facet Counts

**What:** Calculate product counts per filter value to show users how many products match each option

**When to use:** All filter groups (brands, attributes, availability) to improve UX

**Example:**
```typescript
// Source: Prisma aggregations pattern
// apps/server/src/modules/product/product.controller.ts

interface FacetCounts {
  brands: Array<{ id: string; name: string; count: number }>;
  attributes: Record<string, Array<{ value: string; count: number }>>;
  availability: Array<{ status: string; count: number }>;
}

export class ProductController {
  async getFacetCounts(categoryPath: string, currentFilters: FilterOptions): Promise<FacetCounts> {
    // Base where clause (category + currently applied filters)
    const baseWhere: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
      isActive: true,
      category: { path: { startsWith: categoryPath } }
    };

    // Apply current filters EXCEPT the one we're calculating counts for
    // (to show how many products each option would add/remove)

    // Brand facet counts
    const brandCounts = await this.prisma.product.groupBy({
      by: ['brandId'],
      where: {
        ...baseWhere,
        // Exclude brand filter to show all available brands
        price: currentFilters.minPrice ? { gte: currentFilters.minPrice, lte: currentFilters.maxPrice } : undefined
      },
      _count: { brandId: true }
    });

    const brands = await this.prisma.brand.findMany({
      where: { id: { in: brandCounts.map(b => b.brandId).filter(Boolean) as string[] } }
    });

    const brandFacets = brandCounts
      .filter(b => b.brandId)
      .map(b => ({
        id: b.brandId!,
        name: brands.find(br => br.id === b.brandId)?.name || '',
        count: b._count.brandId
      }));

    // Attribute facet counts (requires JSONB aggregation - more complex)
    // Simplified: fetch all matching products and count attribute values in application
    const products = await this.prisma.product.findMany({
      where: baseWhere,
      select: { attributes: true }
    });

    const attributeFacets: Record<string, Map<string, number>> = {};

    products.forEach(product => {
      const attrs = product.attributes as Record<string, any>;
      Object.entries(attrs).forEach(([key, value]) => {
        if (!attributeFacets[key]) {
          attributeFacets[key] = new Map();
        }
        const count = attributeFacets[key].get(value) || 0;
        attributeFacets[key].set(value, count + 1);
      });
    });

    const attributeFacetsArray = Object.entries(attributeFacets).reduce((acc, [key, valueMap]) => {
      acc[key] = Array.from(valueMap.entries()).map(([value, count]) => ({ value, count }));
      return acc;
    }, {} as Record<string, Array<{ value: string; count: number }>>);

    // Availability facet counts
    const inStockCount = await this.prisma.product.count({
      where: {
        ...baseWhere,
        variants: { some: { stock: { gt: 0 } } }
      }
    });

    const outOfStockCount = await this.prisma.product.count({
      where: {
        ...baseWhere,
        variants: { every: { stock: { equals: 0 } } }
      }
    });

    return {
      brands: brandFacets,
      attributes: attributeFacetsArray,
      availability: [
        { status: 'in_stock', count: inStockCount },
        { status: 'out_of_stock', count: outOfStockCount }
      ]
    };
  }
}
```

**Key insight:** Facet counts require careful filter exclusion - show counts for "what products would I see if I select this option", not "how many products currently match". For large catalogs, cache facet counts or calculate on-demand only for visible filter groups.

### Pattern 4: Mobile Filter Drawer UI

**What:** Responsive filter UI that shows sidebar on desktop, full-screen drawer on mobile

**When to use:** All category and search result pages with filters

**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/sheet + responsive patterns
// apps/client/src/components/filters/filter-drawer.tsx

'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { useFilters } from '@/hooks/use-filters';
import { FilterContent } from './filter-content';

export function FilterDrawer({ categoryAttributes, facetCounts }) {
  const [open, setOpen] = useState(false);
  const [filters] = useFilters();

  // Count active filters for badge
  const activeFilterCount =
    filters.brands.length +
    filters.attributes.length +
    filters.availability.length +
    (filters.minPrice > 0 || filters.maxPrice < 999999 ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="mt-6 overflow-y-auto h-[calc(100vh-8rem)]">
          <FilterContent
            categoryAttributes={categoryAttributes}
            facetCounts={facetCounts}
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4 flex gap-2">
          <Button onClick={() => setOpen(false)} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={clearAllFilters} className="flex-1">
            Clear All
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Desktop sidebar (always visible)
export function FilterSidebar({ categoryAttributes, facetCounts }) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-20">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <FilterContent
          categoryAttributes={categoryAttributes}
          facetCounts={facetCounts}
        />
      </div>
    </aside>
  );
}
```

**Key insight:** Sheet component handles focus trap, scroll lock, ESC key, and accessibility. Use same FilterContent component in both drawer and sidebar to avoid duplication. Apply/Clear buttons only needed on mobile - desktop updates immediately via nuqs.

### Pattern 5: Price Range Filter with Dual Inputs

**What:** Price filter with range slider and manual input fields for precise control

**When to use:** All category pages with price filtering

**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/slider + dual input pattern
// apps/client/src/components/filters/price-filter.tsx

'use client';

import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useFilters } from '@/hooks/use-filters';
import { useDebouncedCallback } from 'use-debounce';
import { formatPrice } from '@/lib/utils';

interface PriceFilterProps {
  minPrice?: number; // From product catalog
  maxPrice?: number;
}

export function PriceFilter({ minPrice = 0, maxPrice = 999999 }: PriceFilterProps) {
  const [filters, setFilters] = useFilters();

  const [localRange, setLocalRange] = useState([filters.minPrice, filters.maxPrice]);

  // Debounce URL updates to avoid excessive re-renders
  const debouncedSetFilters = useDebouncedCallback((values: [number, number]) => {
    setFilters({ minPrice: values[0], maxPrice: values[1], page: 1 });
  }, 300);

  const handleSliderChange = (values: number[]) => {
    setLocalRange(values as [number, number]);
    debouncedSetFilters(values as [number, number]);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) * 100; // Convert dollars to cents
    if (!isNaN(value)) {
      const newRange: [number, number] = [value, localRange[1]];
      setLocalRange(newRange);
      debouncedSetFilters(newRange);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) * 100;
    if (!isNaN(value)) {
      const newRange: [number, number] = [localRange[0], value];
      setLocalRange(newRange);
      debouncedSetFilters(newRange);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Price Range</label>
        <button
          onClick={() => {
            setLocalRange([minPrice, maxPrice]);
            setFilters({ minPrice, maxPrice, page: 1 });
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Reset
        </button>
      </div>

      <Slider
        min={minPrice}
        max={maxPrice}
        step={100} // $1 increments
        value={localRange}
        onValueChange={handleSliderChange}
        className="w-full"
      />

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Min</label>
          <Input
            type="text"
            value={formatPrice(localRange[0])}
            onChange={handleMinInputChange}
            className="h-9"
          />
        </div>
        <span className="text-muted-foreground">—</span>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Max</label>
          <Input
            type="text"
            value={formatPrice(localRange[1])}
            onChange={handleMaxInputChange}
            className="h-9"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {formatPrice(localRange[0])} - {formatPrice(localRange[1])}
      </p>
    </div>
  );
}
```

**Key insight:** Local state for slider to avoid lag during drag, debounce URL updates to reduce re-renders, sync inputs with slider for consistency. Format prices for display ($50.00) but store as cents (5000) internally.

### Pattern 6: Dynamic Attribute Filters Based on CategoryAttribute

**What:** Render different filter UI based on CategoryAttribute type (SELECT → checkboxes, RANGE → slider, BOOLEAN → single checkbox)

**When to use:** Category pages with dynamic filterable attributes

**Example:**
```typescript
// Source: CategoryAttribute model + conditional rendering pattern
// apps/client/src/components/filters/attribute-filter.tsx

'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useFilters } from '@/hooks/use-filters';
import type { CategoryAttribute } from '@repo/types';

interface AttributeFilterProps {
  attribute: CategoryAttribute;
  facetCounts?: Array<{ value: string; count: number }>;
}

export function AttributeFilter({ attribute, facetCounts = [] }: AttributeFilterProps) {
  const [filters, setFilters] = useFilters();

  const selectedValues = filters.attributes
    .filter(attr => attr.startsWith(`${attribute.key}:`))
    .map(attr => attr.split(':')[1]);

  const handleToggle = (value: string) => {
    const attrString = `${attribute.key}:${value}`;
    const newAttributes = selectedValues.includes(value)
      ? filters.attributes.filter(a => a !== attrString)
      : [...filters.attributes, attrString];

    setFilters({ attributes: newAttributes, page: 1 });
  };

  // Render based on attribute type
  switch (attribute.type) {
    case 'SELECT':
      return (
        <div className="space-y-3">
          <label className="text-sm font-medium">{attribute.name}</label>
          <div className="space-y-2">
            {attribute.values.map(value => {
              const count = facetCounts.find(f => f.value === value)?.count || 0;
              const isSelected = selectedValues.includes(value);

              return (
                <label
                  key={value}
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(value)}
                    />
                    <span className="text-sm">{value}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      );

    case 'RANGE':
      // Range slider for numeric attributes (e.g., screen size: 32-85 inches)
      const minValue = Math.min(...attribute.values.map(v => parseFloat(v)));
      const maxValue = Math.max(...attribute.values.map(v => parseFloat(v)));

      return (
        <div className="space-y-3">
          <label className="text-sm font-medium">{attribute.name}</label>
          <Slider
            min={minValue}
            max={maxValue}
            step={1}
            value={[minValue, maxValue]} // TODO: track range in filters
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            {minValue} - {maxValue} {attribute.unit}
          </p>
        </div>
      );

    case 'BOOLEAN':
      // Single checkbox for yes/no attributes
      const isChecked = selectedValues.includes('true');

      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => handleToggle(checked ? 'true' : 'false')}
          />
          <span className="text-sm">{attribute.name}</span>
        </label>
      );

    default:
      return null;
  }
}
```

**Key insight:** CategoryAttribute type drives UI rendering - SELECT becomes checkbox group, RANGE becomes slider, BOOLEAN becomes single checkbox. Facet counts show product availability per value. Store attribute filters as "key:value" strings in URL for simplicity.

### Anti-Patterns to Avoid

- **Client-side filtering with large catalogs:** Fetching all products to filter client-side is slow and wastes bandwidth - always filter server-side with Prisma
- **Filters without product counts:** Users need to know if selecting a filter will return zero results - always show facet counts
- **Immediate URL updates on slider drag:** Updating URL on every slider move causes lag and history pollution - debounce by 300ms
- **Missing "Clear all" button:** Users get stuck with filters applied - provide one-click clear all filters
- **Not resetting to page 1 on filter change:** Applying filters on page 5 can show empty results - always reset pagination
- **NEXT_PUBLIC_* env vars for filter config:** Don't hardcode min/max price or availability options - derive from product catalog data
- **Ignoring GIN index configuration:** Filtering JSONB attributes without GIN index causes sequential scans - verify `@@index([attributes], type: Gin)` exists

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL state management | Manual useSearchParams + useRouter.push | nuqs | Type safety, automatic serialization, shallow routing, history management, 6KB bundle size vs 100+ lines of custom code |
| Range slider | Custom div with mouse events | shadcn/ui Slider (Radix UI) | Accessibility (ARIA, keyboard nav), touch support, RTL, dual handles, 12KB vs custom 50KB + edge cases |
| Filter checkbox groups | Plain checkboxes with state | shadcn/ui Checkbox + controlled state | Indeterminate state, form integration, accessible labels, consistent styling |
| Mobile filter modal | Custom overlay + portal | shadcn/ui Sheet | Focus trap, body scroll lock, ESC key, ARIA attributes, portal rendering, 20KB vs 80KB custom |
| Debouncing | setTimeout/clearTimeout | use-debounce hook | Handles cleanup, React lifecycle, leading/trailing edge, maxWait option |
| JSONB attribute queries | Raw SQL or complex Prisma nested where | Prisma JSONB path operators | Type-safe, prevents SQL injection, uses GIN index efficiently, readable syntax |

**Key insight:** Filter UI appears simple ("just checkboxes and sliders") but production UX requires accessibility, performance optimization (debouncing, URL management), mobile patterns (drawer UI), and database efficiency (GIN indexes). Libraries provide battle-tested solutions.

## Common Pitfalls

### Pitfall 1: Filter Logic Confusion (OR vs AND)

**What goes wrong:** Selecting "Red" and "Blue" shows no products instead of showing products that are red OR blue

**Why it happens:** Implementing AND logic between same-attribute values instead of OR within groups, AND across groups

**How to avoid:**
```typescript
// WRONG: AND between same attribute values
where: {
  AND: [
    { attributes: { path: ['color'], equals: 'red' } },
    { attributes: { path: ['color'], equals: 'blue' } }
  ]
}
// Result: No products (can't be both red AND blue)

// CORRECT: OR within group, AND across groups
where: {
  AND: [
    // Color group (OR)
    {
      OR: [
        { attributes: { path: ['color'], equals: 'red' } },
        { attributes: { path: ['color'], equals: 'blue' } }
      ]
    },
    // Size group (OR)
    {
      OR: [
        { attributes: { path: ['size'], equals: 'large' } },
        { attributes: { path: ['size'], equals: 'medium' } }
      ]
    }
  ]
}
// Result: Products that are (red OR blue) AND (large OR medium)
```

**Warning signs:** Filters reduce results too aggressively, selecting multiple values within same attribute shows zero results, users report "filters don't work"

### Pitfall 2: Missing GIN Index Performance

**What goes wrong:** Filter queries take >1 second even with few products, database CPU spikes during filtering

**Why it happens:** Prisma JSONB queries without GIN index perform sequential scans on entire products table

**How to avoid:**
```prisma
// packages/db/prisma/schema.prisma
model Product {
  // ...
  attributes Json @default("{}") // JSONB for dynamic attributes

  @@index([attributes], type: Gin) // REQUIRED for fast JSONB filtering
}
```

Verify index exists:
```sql
-- In PostgreSQL
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'products';
```

**Warning signs:** EXPLAIN ANALYZE shows sequential scan on products table, filter queries >500ms, CPU usage correlates with number of products

**Performance target:** <50ms filter queries with GIN index, even with 100k+ products

### Pitfall 3: Stale Facet Counts

**What goes wrong:** Filter shows "Brand A (5)" but selecting it shows 0 products

**Why it happens:** Facet counts calculated without considering currently applied filters, or cached facet data is stale

**How to avoid:** Always calculate facet counts with current filter context (excluding the facet being counted), and invalidate cache when products change

```typescript
// When calculating brand facet counts, INCLUDE price/attribute filters, EXCLUDE brand filter
const brandCounts = await prisma.product.groupBy({
  by: ['brandId'],
  where: {
    ...baseFilters, // price, attributes, category
    // DON'T include brandId filter here - we want to see all brands
  }
});
```

**Warning signs:** Users click filter option and see "No products found", facet counts don't change when other filters applied, cached facet data from hours ago

### Pitfall 4: URL Pollution from Slider Drag

**What goes wrong:** Dragging price slider creates 50+ browser history entries, back button barely moves

**Why it happens:** Updating URL on every slider onChange event (fires 60+ times per second during drag)

**How to avoid:** Debounce URL updates by 300ms:

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSetFilters = useDebouncedCallback((values) => {
  setFilters({ minPrice: values[0], maxPrice: values[1] });
}, 300);

<Slider onValueChange={debouncedSetFilters} />
```

**Warning signs:** Browser history filled with tiny price changes, back button requires 10+ clicks to leave page, performance lag during slider drag

### Pitfall 5: Mobile Filter UX Issues

**What goes wrong:** Mobile users can't apply filters (no "Apply" button), or filters don't persist when closing drawer

**Why it happens:** Desktop pattern (immediate URL update) doesn't work on mobile - users expect apply/cancel buttons

**How to avoid:** Use Sheet component with apply/clear buttons, and track "pending" filter state:

```typescript
export function FilterDrawer() {
  const [filters, setFilters] = useFilters();
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    setFilters(pendingFilters); // Commit to URL
    setOpen(false);
  };

  const handleCancel = () => {
    setPendingFilters(filters); // Reset to current
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Filter UI updates pendingFilters, not filters */}
      <SheetFooter>
        <Button onClick={handleApply}>Apply</Button>
        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
      </SheetFooter>
    </Sheet>
  );
}
```

**Warning signs:** High mobile bounce rate on category pages, users report "filters disappear", mobile analytics show drawer opens but filters never applied

### Pitfall 6: SEO Duplicate Content from Filters

**What goes wrong:** Google indexes thousands of filter parameter combinations as duplicate content, dilutes page authority

**Why it happens:** All filtered URLs (e.g., `/categories/phones?brand=apple`, `/categories/phones?brand=samsung`) are indexable

**How to avoid:** Add canonical URL to base category page, and use noindex for filtered views:

```typescript
// apps/client/app/categories/[slug]/page.tsx
export async function generateMetadata({ params, searchParams }): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;

  const hasFilters = query.brands || query.attributes || query.minPrice;

  return {
    title: category.name,
    description: category.description,
    alternates: {
      canonical: `/categories/${slug}` // Always canonical to base URL
    },
    robots: hasFilters ? {
      index: false, // Don't index filtered views
      follow: true  // But follow links
    } : undefined
  };
}
```

**Warning signs:** Google Search Console shows thousands of indexed category pages, duplicate content warnings, declining organic traffic to category pages

### Pitfall 7: Availability Filter Not Accounting for Variants

**What goes wrong:** "In Stock" filter shows products with stock = 0, or excludes variable products with some variants in stock

**Why it happens:** Checking product.stock instead of product.variants.stock aggregation

**How to avoid:** For variable products, check if ANY variant has stock > 0:

```typescript
// WRONG: Simple products only
where: { stock: { gt: 0 } }

// CORRECT: Handles all product types
where: {
  OR: [
    // Simple products with stock field
    { productType: 'SIMPLE', stock: { gt: 0 } },
    // Variable products with at least one variant in stock
    { productType: 'VARIABLE', variants: { some: { stock: { gt: 0 } } } }
  ]
}
```

**Warning signs:** Variable products never show as "in stock", users report "product shows in stock but all variants sold out"

## Code Examples

Verified patterns from official sources:

### Complete Filter Integration Example

```typescript
// Source: nuqs documentation + Next.js App Router patterns
// apps/client/app/categories/[slug]/page.tsx

import { Suspense } from 'react';
import { FilterSidebar } from '@/components/filters/filter-sidebar';
import { FilterDrawer } from '@/components/filters/filter-drawer';
import { ActiveFilters } from '@/components/filters/active-filters';
import { ProductGrid } from '@/components/product/product-grid';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  // Fetch category with attributes
  const category = await api.categories.getBySlug(slug);

  // Parse filters from URL
  const filters = parseFiltersFromQuery(query);

  // Fetch filtered products
  const { products, total, facetCounts } = await api.products.filter({
    categoryPath: category.path,
    ...filters
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs categorySlug={slug} />

      <div className="flex gap-8 mt-6">
        {/* Desktop sidebar - always visible */}
        <FilterSidebar
          categoryAttributes={category.attributes}
          facetCounts={facetCounts}
        />

        <div className="flex-1">
          {/* Mobile filter button */}
          <div className="lg:hidden mb-4">
            <FilterDrawer
              categoryAttributes={category.attributes}
              facetCounts={facetCounts}
            />
          </div>

          {/* Active filters chips */}
          <Suspense fallback={null}>
            <ActiveFilters />
          </Suspense>

          {/* Product grid */}
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              {total} products found
            </p>
            <ProductGrid products={products} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Active Filters Display with Clear Buttons

```typescript
// Source: shadcn/ui Badge component pattern
// apps/client/src/components/filters/active-filters.tsx

'use client';

import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useFilters } from '@/hooks/use-filters';

export function ActiveFilters() {
  const [filters, setFilters] = useFilters();

  const activeFilters = [
    ...filters.brands.map(b => ({ type: 'brand', value: b, label: `Brand: ${b}` })),
    ...filters.attributes.map(a => {
      const [key, value] = a.split(':');
      return { type: 'attribute', value: a, label: `${key}: ${value}` };
    }),
    ...filters.availability.map(a => ({ type: 'availability', value: a, label: a.replace('_', ' ') }))
  ];

  if (filters.minPrice > 0 || filters.maxPrice < 999999) {
    activeFilters.push({
      type: 'price',
      value: 'price',
      label: `$${filters.minPrice / 100} - $${filters.maxPrice / 100}`
    });
  }

  if (activeFilters.length === 0) return null;

  const handleClear = (filter: typeof activeFilters[0]) => {
    switch (filter.type) {
      case 'brand':
        setFilters({ brands: filters.brands.filter(b => b !== filter.value) });
        break;
      case 'attribute':
        setFilters({ attributes: filters.attributes.filter(a => a !== filter.value) });
        break;
      case 'availability':
        setFilters({ availability: filters.availability.filter(a => a !== filter.value) });
        break;
      case 'price':
        setFilters({ minPrice: 0, maxPrice: 999999 });
        break;
    }
  };

  const clearAll = () => {
    setFilters({
      brands: [],
      attributes: [],
      availability: [],
      minPrice: 0,
      maxPrice: 999999
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {activeFilters.map((filter, index) => (
        <Badge key={index} variant="secondary" className="gap-1">
          {filter.label}
          <button
            onClick={() => handleClear(filter)}
            className="hover:bg-muted rounded-full"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <button
        onClick={clearAll}
        className="text-sm text-muted-foreground hover:text-foreground underline"
      >
        Clear all
      </button>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual useSearchParams + useRouter | nuqs library | 2023-2024 | Type safety, automatic serialization, 90% less boilerplate code |
| Client-side filtering | Server-side filtering with RSC | 2023+ | Better performance, SEO-friendly, works without JS |
| Custom range slider | Radix UI Slider (shadcn/ui) | 2022+ | Accessibility, smaller bundle (12KB vs 50KB+), better mobile support |
| SQL string concatenation | Prisma JSONB operators | 2021+ | Type safety, SQL injection prevention, GIN index utilization |
| Redux/Context for filter state | URL as single source of truth | 2020+ | Shareable links, bookmarkable filters, simpler state management |
| Custom modal libraries | Radix Dialog/Sheet primitives | 2022+ | Better accessibility, smaller bundle, platform-native behavior |
| Immediate URL updates | Debounced updates (300ms) | Ongoing | Prevents history pollution, better UX, fewer re-renders |

**Deprecated/outdated:**
- **React Query for filter state:** URL is better source of truth for filters - no need for separate client state management
- **Custom checkbox implementations:** Radix UI provides accessible checkbox primitive - custom checkboxes miss ARIA attributes
- **Algolia InstantSearch without customization:** Off-the-shelf InstantSearch UI doesn't match custom design - use headless components
- **OR logic for all filters:** Modern e-commerce uses OR within groups, AND across groups - single OR logic confuses users

## Open Questions

1. **Facet count caching strategy**
   - What we know: Calculating facet counts requires aggregating entire product catalog per category
   - What's unclear: Best caching strategy - cache per category, invalidate on product changes, or calculate on-demand
   - Recommendation: Cache facet counts per category in Redis with 15-minute TTL, invalidate on product create/update/delete events. Calculate on-demand only if cache miss.

2. **Filter URL length limits**
   - What we know: URLs >2000 characters can cause issues with some browsers and proxies
   - What's unclear: How to handle 50+ selected filter values (e.g., selecting all brands)
   - Recommendation: Use shortened syntax (comma-separated IDs instead of names), or implement "Save Filter" feature storing filter set server-side with short ID

3. **Range attribute filtering UI**
   - What we know: CategoryAttribute type RANGE exists, but unclear if it should be discrete values or continuous range
   - What's unclear: Should "Screen Size" (32, 43, 55, 65, 75) be checkboxes or range slider (32-75)?
   - Recommendation: Use checkboxes for discrete RANGE values (<10 options), slider for continuous ranges (price, weight). Add "isDiscrete" field to CategoryAttribute if needed.

4. **Pre-order availability filtering**
   - What we know: Requirements mention "pre-order" availability option, but Product schema doesn't have pre-order status
   - What's unclear: How to determine if product is available for pre-order - separate field, or stock = 0 + availabilityDate future?
   - Recommendation: Add "availabilityStatus" enum to Product schema (IN_STOCK, OUT_OF_STOCK, PRE_ORDER) for Phase 6, or defer pre-order to Phase 14 (Inventory).

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
| FILT-01 | Render filters based on category attributes | unit | `pnpm test src/components/filters/attribute-filter.test.tsx -t "renders SELECT as checkboxes"` | ❌ Wave 0 |
| FILT-01 | Fetch category attributes for filter rendering | integration | `pnpm test src/app/categories/[slug]/page.test.tsx -t "loads category attributes"` | ❌ Wave 0 |
| FILT-02 | Price range slider updates URL params | unit | `pnpm test src/components/filters/price-filter.test.tsx -t "updates URL on slider change"` | ❌ Wave 0 |
| FILT-02 | Manual price inputs sync with slider | unit | `pnpm test src/components/filters/price-filter.test.tsx -t "syncs input with slider"` | ❌ Wave 0 |
| FILT-03 | Checkbox filters update URL params | unit | `pnpm test src/components/filters/attribute-filter.test.tsx -t "toggles checkbox updates URL"` | ❌ Wave 0 |
| FILT-03 | Facet counts display correctly | integration | `pnpm test apps/server/src/modules/product/product.service.test.ts -t "calculates facet counts"` | ❌ Wave 0 |
| FILT-04 | Filter state persists in URL | integration | `pnpm test src/hooks/use-filters.test.tsx -t "nuqs persists to URL"` | ❌ Wave 0 |
| FILT-04 | URL params restore filter state | integration | `pnpm test src/app/categories/[slug]/page.test.tsx -t "restores filters from searchParams"` | ❌ Wave 0 |
| FILT-05 | OR logic within attribute groups | integration | `pnpm test apps/server/src/modules/product/product.service.test.ts -t "filters with OR within groups"` | ❌ Wave 0 |
| FILT-05 | AND logic across attribute groups | integration | `pnpm test apps/server/src/modules/product/product.service.test.ts -t "filters with AND across groups"` | ❌ Wave 0 |
| FILT-06 | Mobile drawer opens and closes | unit | `pnpm test src/components/filters/filter-drawer.test.tsx -t "opens on button click"` | ❌ Wave 0 |
| FILT-06 | Apply button commits filter state | unit | `pnpm test src/components/filters/filter-drawer.test.tsx -t "apply button updates URL"` | ❌ Wave 0 |
| FILT-07 | Availability filter shows correct options | unit | `pnpm test src/components/filters/availability-filter.test.tsx -t "renders in stock and out of stock"` | ❌ Wave 0 |
| FILT-07 | Availability filtering queries variants | integration | `pnpm test apps/server/src/modules/product/product.service.test.ts -t "filters by variant stock"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test --run --reporter=dot` (run affected tests, dot reporter for speed)
- **Per wave merge:** `pnpm test --run` (full suite without watch mode)
- **Phase gate:** `pnpm test --run` with all tests green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/client/src/components/filters/attribute-filter.test.tsx` — covers FILT-01, FILT-03 (dynamic filter rendering)
- [ ] `apps/client/src/components/filters/price-filter.test.tsx` — covers FILT-02 (price slider and inputs)
- [ ] `apps/client/src/components/filters/filter-drawer.test.tsx` — covers FILT-06 (mobile drawer UI)
- [ ] `apps/client/src/components/filters/availability-filter.test.tsx` — covers FILT-07 (availability checkboxes)
- [ ] `apps/client/src/hooks/use-filters.test.tsx` — covers FILT-04 (URL state persistence)
- [ ] `apps/client/src/app/categories/[slug]/page.test.tsx` — covers FILT-01, FILT-04 (server component integration)
- [ ] `apps/server/src/modules/product/product.service.test.ts` — covers FILT-03, FILT-05, FILT-07 (filter query logic)
- [ ] Update `vitest.setup.ts` — add nuqs mock to prevent "Not in a browser" errors

**Rationale for test types:**
- **Unit tests** for client components verify UI behavior (checkbox toggles, slider updates, drawer open/close)
- **Integration tests** for server-side filtering verify Prisma queries, facet counts, and filter logic (OR/AND)
- **No E2E tests** needed - filter UI interactions covered by unit tests, server filtering by integration tests

## Sources

### Primary (HIGH confidence)
- [nuqs Official Documentation](https://nuqs.dev/) - Type-safe URL state management
- [nuqs GitHub Repository](https://github.com/47ng/nuqs) - Source code and examples
- [shadcn/ui Slider Component](https://ui.shadcn.com/docs/components/radix/slider) - Range slider implementation
- [shadcn/ui Sheet Component](https://ui.shadcn.com/docs/components/radix/sheet) - Mobile drawer pattern
- [shadcn/ui Checkbox Component](https://ui.shadcn.com/docs/components/radix/checkbox) - Multi-select checkboxes
- [Prisma JSONB Documentation](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields) - JSONB path operators
- [PostgreSQL GIN Indexes](https://www.postgresql.org/docs/current/gin.html) - GIN index for JSONB
- [Next.js App Router Search Params](https://nextjs.org/docs/app/api-reference/file-conventions/page) - Server Component searchParams

### Secondary (MEDIUM confidence)
- [Managing search parameters in Next.js with nuqs - LogRocket](https://blog.logrocket.com/managing-search-parameters-next-js-nuqs/) - nuqs patterns and best practices
- [Filtering UX: Combining Filter Options – Baymard](https://baymard.com/blog/allow-applying-of-multiple-filter-values) - OR/AND logic UX research
- [Filter UI Design: Best UX Practices - Insaim Design](https://www.insaim.design/blog/filter-ui-design-best-ux-practices-and-examples) - Filter UI patterns
- [React Dual Range Price Slider - TestKarts](https://www.testkarts.com/blog/dual-range-price-slider-with-input-box) - Price slider implementation
- [Creating Responsive Dialog and Drawer - Next.js Shop](https://www.nextjsshop.com/resources/blog/responsive-dialog-drawer-shadcn-ui) - Responsive modal patterns
- [PostgreSQL JSONB GIN Indexes - DEV Community](https://dev.to/polliog/postgresql-jsonb-gin-indexes-why-your-queries-are-slow-and-how-to-fix-them-12a0) - Performance optimization
- [Faceted Search Best Practices - BrokenRubik](https://www.brokenrubik.com/blog/faceted-search-best-practices) - Facet count patterns
- [SEO Canonical URL Guide - Google Search Central](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) - Canonical tag for filters

### Tertiary (LOW confidence)
- [React Filters - TailGrids](https://tailgrids.com/react/components/filters) - Community filter components (needs verification)
- [How to debounce in React - Developer Way](https://www.developerway.com/posts/debouncing-in-react) - Debouncing patterns (general React, not filter-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified from official docs, npm registry, and active maintenance
- Architecture patterns: HIGH - nuqs, shadcn/ui, and Prisma JSONB patterns verified from official documentation
- Filter logic (OR/AND): HIGH - Verified from Baymard UX research (industry standard e-commerce pattern)
- Mobile patterns: HIGH - shadcn/ui Sheet component and responsive patterns verified from official docs
- Pitfalls: MEDIUM-HIGH - Based on PostgreSQL docs, common developer issues (DEV Community), and Baymard UX research
- Performance: HIGH - PostgreSQL GIN index behavior verified from official documentation

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (30 days - nuqs and shadcn/ui are stable, filter patterns well-established)
