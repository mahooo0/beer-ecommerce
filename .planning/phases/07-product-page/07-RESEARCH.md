# Phase 7: Product Page - Research

**Researched:** 2026-03-11
**Domain:** Next.js App Router product detail page with image gallery, variant selection, type-specific displays, and e-commerce UX patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Image Gallery & Lightbox**
- Large hero image with horizontal thumbnail strip below
- Hover zoom (magnifier lens) on desktop — shows zoomed-in portion on mouse hover
- Mobile gets pinch-to-zoom instead of hover zoom
- Click main image or fullscreen icon opens dark overlay lightbox with arrow key + swipe navigation
- Mobile gallery: swipeable horizontal carousel with dot indicators

**Variant Selector**
- All option types (color, size, material, etc.) use dropdown menus — consistent and compact
- Selecting a variant swaps the gallery to variant-specific images (falls back to product images if variant has none)
- Price, stock status, and SKU update dynamically when variant is selected
- Unavailable variant combinations shown as disabled (grayed out) in dropdowns — visible but unselectable

**Related Products**
- Auto-generated from products sharing the same category or tags — no manual curation
- Displayed as a horizontal scrollable carousel with arrows
- Shows 4-5 ProductCards on desktop, 2 on mobile
- Reuses existing ProductCard component

**Frequently Bought Together**
- Auto-generated from order history analysis — products commonly purchased together
- Each suggested item has a checkbox (all checked by default)
- User can uncheck items they don't want
- "Add selected to cart" button shows total price for selected items

**Type-Specific Displays**
- **Layout approach:** Single product page layout with conditional type-specific sections — not separate pages per type
- **Weighted products:** Slider + input field for quantity (e.g., 0.1kg to 10kg). Price updates in real-time. Unit price (price per kg/lb) shown prominently
- **Digital products:** Visual file type icon (PDF, ZIP, MP3) + file size + format name + delivery method ("Instant download after purchase"). Clear "no shipping required" indicator
- **Bundle products:** List of included items with thumbnails, names, individual prices. Shows total if bought separately vs bundle price with savings callout

**Stock Status Display**
- Real-time stock status: "In Stock", "Low Stock (X left)", "Out of Stock"
- Stock status shown near the add-to-cart button area

**Specifications/Attributes Table**
- Two-column table showing product attributes from JSONB `attributes` field
- Category-specific attributes displayed based on product's category

**Reviews Section**
- Average rating with star display and rating distribution bar chart
- Individual reviews with star rating, reviewer name, date, review text
- Placeholder for full reviews system (Phase 16) — display-only for now

### Claude's Discretion
- Loading skeleton design for product page
- Exact spacing, typography, and responsive breakpoints
- Error state handling (product not found, API failure)
- "Frequently bought together" algorithm specifics (co-occurrence threshold, minimum order count)
- Specifications table styling and grouping
- Lightbox library choice vs custom implementation
- Image zoom library choice vs custom implementation

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PDPG-01 | Product page displays image gallery with zoom, thumbnails, and fullscreen lightbox | Custom gallery component with CSS zoom; lightbox via yet-another-react-lightbox or custom overlay |
| PDPG-02 | Variable products show variant selector (dropdowns/swatches) that updates price, images, and stock | Client component with useState; variant combination matrix built from API data |
| PDPG-03 | Product page shows specifications/attributes table | Read JSONB `attributes` field + CategoryAttribute definitions for display names |
| PDPG-04 | Product page shows related products carousel | Server-side query: same category OR shared tags; CSS scroll-snap carousel |
| PDPG-05 | Product page shows "frequently bought together" section with one-click add-all | MongoDB order history co-occurrence query; server endpoint; checkbox UI with cart store |
| PDPG-06 | Product page shows reviews section with average rating, distribution, and individual reviews | Display-only from Review table; rating distribution computed from review records |
| PDPG-07 | Product page shows real-time stock status (in stock, low stock with count, out of stock) | Derived from variant.stock; threshold for "low stock" is configurable (suggest <= 5) |
| PDPG-08 | Weighted products show unit price calculator (price per kg/lb with quantity selector) | WeightedMeta.pricePerUnit + slider/input; real-time multiplication client-side |
| PDPG-09 | Digital products show file info, preview, and delivery method description | DigitalMeta fields: fileFormat → icon map; fileSize bytes → human readable |
| PDPG-10 | Bundle products show included items with individual and bundle pricing comparison | BundleItem.product includes price; sum individual prices vs bundle price |
</phase_requirements>

---

## Summary

Phase 7 builds the product detail page (PDP) at `apps/client/src/app/products/[slug]/page.tsx`. The server already exposes `GET /api/products/slug/:slug` which returns the full product graph including variants, digitalMeta, weightedMeta, bundleItems, tags, and category. The client needs a new `[slug]` route that does not yet exist — only the listing page exists.

The architecture follows the established pattern: Next.js Server Component at `[slug]/page.tsx` fetches data via `api.getBySlug()`, then passes data to client island components for interactive features (gallery zoom, variant selector, weight calculator, cart actions). All styling uses Tailwind CSS v4; no shadcn/ui. The `useCartStore` Zustand store handles add-to-cart. The existing `ProductCard` component is directly reusable for related products and frequently bought together sections.

The most complex pieces are: (1) the variant combination matrix for variable products — building a lookup map from variant options to determine which combinations are valid/invalid, and (2) the image gallery with hover magnifier. Both are implemented as client components wrapping server-fetched data. New server API endpoints are needed for related products and frequently bought together.

**Primary recommendation:** Build a single `ProductPageClient` client component that receives the full product as a prop from the server component, with sub-components for each feature section. Keep server component thin — just fetch and pass data down. All interactivity lives in client islands.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.5 (already installed) | App Router, Server Components, `next/image` | Project standard |
| React | 19.2.0 (already installed) | Client component islands | Project standard |
| Tailwind CSS | v4.x (already installed) | All styling | Phase 6 decision — no shadcn/ui |
| Zustand | 5.x (already installed) | Cart store access from product page | Already in cart-store.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| yet-another-react-lightbox | ~3.x | Fullscreen lightbox overlay | Claude's discretion for lightbox — this is the most maintained, accessible lightbox library (2024-2025) |
| No extra zoom library | — | Hover zoom via CSS + JS | Custom magnifier via CSS `transform: scale()` + mouse position math is ~50 lines; avoids dependency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| yet-another-react-lightbox | react-image-lightbox | react-image-lightbox is unmaintained (last release 2021); yet-another-react-lightbox is actively maintained with accessibility |
| Custom hover zoom | react-image-magnifiers | react-image-magnifiers adds 15KB; custom CSS approach is simpler and sufficient |
| CSS scroll-snap carousel | embla-carousel | embla-carousel is more powerful but adds 7KB; CSS scroll-snap is sufficient for 4-5 cards |

**Installation (new library only):**
```bash
pnpm add yet-another-react-lightbox --filter client
```

---

## Architecture Patterns

### Recommended Project Structure
```
apps/client/src/
├── app/products/
│   ├── page.tsx                          # existing listing page (unchanged)
│   ├── loading.tsx                       # existing listing skeleton (unchanged)
│   └── [slug]/
│       ├── page.tsx                      # Server Component — fetches product, related, fbt
│       ├── loading.tsx                   # Product page skeleton
│       └── not-found.tsx                 # 404 for invalid slugs
├── components/product/
│   ├── product-card.tsx                  # existing (reused)
│   ├── product-grid.tsx                  # existing (reused)
│   ├── product-image-gallery.tsx         # client — hero + thumbnails + zoom
│   ├── product-lightbox.tsx              # client — fullscreen overlay
│   ├── variant-selector.tsx              # client — dropdown variant pickers
│   ├── add-to-cart-button.tsx            # client — quantity + cart store integration
│   ├── product-specs-table.tsx           # server-safe — renders attributes object
│   ├── related-products-carousel.tsx     # client — horizontal scroll with arrows
│   ├── frequently-bought-together.tsx    # client — checkbox list + add-all button
│   ├── reviews-placeholder.tsx           # server-safe — display-only reviews
│   ├── weighted-quantity-selector.tsx    # client — slider + input for weight
│   ├── digital-product-info.tsx          # server-safe — file icon + metadata
│   └── bundle-items-list.tsx             # server-safe — bundle contents + pricing
apps/server/src/modules/product/
├── product.service.ts                    # add getRelated() and getFrequentlyBoughtTogether()
├── product.routes.ts                     # add GET /products/:id/related and /products/:id/fbt
└── product.controller.ts                 # add handler methods
```

### Pattern 1: Server Component Thin Shell
**What:** `[slug]/page.tsx` is an async Server Component that fetches all data, renders layout, and passes to client islands.
**When to use:** All data fetching happens here. No client-side data fetching on initial render.

```typescript
// apps/client/src/app/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let product;
  try {
    const result = await api.products.getBySlug(slug);
    product = result.data;
  } catch {
    notFound();
  }

  if (!product) notFound();

  // Fetch related and FBT in parallel
  const [relatedResult, fbtResult] = await Promise.allSettled([
    api.products.getRelated(product.id),
    api.products.getFrequentlyBoughtTogether(product.id),
  ]);

  const relatedProducts = relatedResult.status === 'fulfilled' ? relatedResult.value.data ?? [] : [];
  const fbtProducts = fbtResult.status === 'fulfilled' ? fbtResult.value.data ?? [] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProductPageClient
        product={product}
        relatedProducts={relatedProducts}
        fbtProducts={fbtProducts}
      />
    </div>
  );
}
```

### Pattern 2: Variant Combination Matrix
**What:** Build a lookup map from variant options to find which combinations exist and whether they are in stock.
**When to use:** For VARIABLE product type in `variant-selector.tsx`.

```typescript
// Build from product.variants[].options[].option.{group.name, value}
type VariantMatrix = Map<string, { variantId: string; stock: number; price: number; images: string[] }>;

function buildVariantMatrix(variants: ProductVariantWithOptions[]): VariantMatrix {
  const matrix = new Map<string, { variantId: string; stock: number; price: number; images: string[] }>();
  for (const variant of variants) {
    // Sort option key to ensure consistent lookup regardless of selection order
    const key = variant.options
      .map(o => `${o.option.group.name}:${o.option.value}`)
      .sort()
      .join('|');
    matrix.set(key, { variantId: variant.id, stock: variant.stock, price: variant.price, images: variant.images });
  }
  return matrix;
}

function buildSelectionKey(selections: Record<string, string>): string {
  return Object.entries(selections)
    .map(([group, value]) => `${group}:${value}`)
    .sort()
    .join('|');
}
```

### Pattern 3: Option Groups from Variant Data
**What:** Derive unique option groups and their values from the variants array for rendering dropdowns.
**When to use:** `variant-selector.tsx` needs to display available groups (Size, Color, etc.).

```typescript
// Derive from product.variants[].options[].option.group
interface OptionGroupDisplay {
  name: string;          // "Size"
  displayName: string;   // "Size"
  values: string[];      // ["S", "M", "L", "XL"]
}

function extractOptionGroups(variants: ProductVariantWithOptions[]): OptionGroupDisplay[] {
  const groupMap = new Map<string, Set<string>>();
  const groupDisplay = new Map<string, string>();
  for (const variant of variants) {
    for (const vo of variant.options) {
      const groupName = vo.option.group.name;
      const displayName = vo.option.group.displayName;
      if (!groupMap.has(groupName)) groupMap.set(groupName, new Set());
      groupMap.get(groupName)!.add(vo.option.value);
      groupDisplay.set(groupName, displayName);
    }
  }
  return Array.from(groupMap.entries()).map(([name, values]) => ({
    name,
    displayName: groupDisplay.get(name) ?? name,
    values: Array.from(values),
  }));
}
```

### Pattern 4: Stock Status Derivation
**What:** Compute stock status from variant data without additional API calls.
**When to use:** Near add-to-cart button; updates on variant selection.

```typescript
// For SIMPLE, WEIGHTED, DIGITAL, BUNDLED: use product-level stock (no variants)
// For VARIABLE: use selected variant.stock
const LOW_STOCK_THRESHOLD = 5;

function getStockStatus(stock: number): { label: string; color: string } {
  if (stock <= 0) return { label: 'Out of Stock', color: 'text-red-600' };
  if (stock <= LOW_STOCK_THRESHOLD) return { label: `Low Stock (${stock} left)`, color: 'text-amber-600' };
  return { label: 'In Stock', color: 'text-green-600' };
}
```

### Pattern 5: Weighted Product Price Calculation
**What:** Real-time price = `(weightedMeta.pricePerUnit / 100) * selectedWeight`.
**When to use:** `weighted-quantity-selector.tsx` for WEIGHTED type.

```typescript
// pricePerUnit is in cents, selectedWeight is a float (kg/lb)
function calcWeightedPrice(pricePerUnit: number, weight: number): number {
  return Math.round(pricePerUnit * weight); // result in cents
}
// formatPrice: (cents / 100).toFixed(2) — existing pattern
```

### Pattern 6: Related Products Server Endpoint
**What:** Server queries products sharing same `categoryId` OR having at least one overlapping tag.
**When to use:** New `getRelated(productId, limit)` on ProductService.

```typescript
// In product.service.ts
async getRelated(productId: string, limit = 5) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true, tags: { select: { tagId: true } } },
  });
  if (!product) return [];

  const tagIds = product.tags.map(t => t.tagId);

  return prisma.product.findMany({
    where: {
      id: { not: productId },
      status: 'ACTIVE',
      isActive: true,
      OR: [
        { categoryId: product.categoryId },
        ...(tagIds.length > 0 ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
      ],
    },
    take: limit,
    include: { brand: true, category: true },
  });
}
```

### Pattern 7: Frequently Bought Together (Order History)
**What:** Query MongoDB Order collection for product co-occurrences. Find products that appear in the same orders as `productId`.
**When to use:** New `getFrequentlyBoughtTogether(productId, limit)`.

```typescript
// In a new service (or OrderService extension)
// MongoDB aggregation: find orders containing productId, group by other productIds in same order
async getFrequentlyBoughtTogether(productId: string, limit = 3) {
  const results = await Order.aggregate([
    { $match: { 'items.productId': productId } },
    { $unwind: '$items' },
    { $match: { 'items.productId': { $ne: productId } } },
    { $group: { _id: '$items.productId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  // If no results, return empty array (graceful degradation)
  const ids = results.map(r => r._id);
  if (ids.length === 0) return [];
  return prisma.product.findMany({
    where: { id: { in: ids }, status: 'ACTIVE', isActive: true },
    include: { brand: true },
  });
}
```

### Pattern 8: Image Gallery with Hover Zoom
**What:** CSS-based magnifier lens. Track mouse position over image container; render a zoomed div positioned at cursor.
**When to use:** Desktop only (`hidden md:block`); mobile gets native pinch-to-zoom.

```typescript
// CSS approach: position:relative container; zoom overlay uses backgroundImage + backgroundPosition
// No library needed — avoids next/image conflicts with magnifier libraries
const [zoomStyle, setZoomStyle] = useState<CSSProperties>({});
const [isZooming, setIsZooming] = useState(false);

function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  setZoomStyle({ backgroundPosition: `${x}% ${y}%` });
}
// Render: <div style={{ backgroundImage: `url(${currentImage})`, backgroundSize: '250%', ...zoomStyle }} />
```

### Anti-Patterns to Avoid
- **Fetching related/FBT client-side on mount:** Causes layout shift and waterfall. Fetch server-side in the Server Component.
- **Storing full product in client state:** Pass product as prop from server; don't re-fetch in client components.
- **Using `product.variants[0].stock` as overall stock:** For VARIABLE products, stock is per-selected-variant. Always derive from selection.
- **Hardcoding "In Stock" without checking variant data:** SIMPLE products may have no variants; use `product.variants` array length check.
- **Co-occurrence threshold too low:** With minimal order history in dev/test data, FBT will return nothing; always handle empty state gracefully.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fullscreen lightbox | Custom overlay with portal | yet-another-react-lightbox | Handles keyboard nav, swipe, focus trap, accessibility, ARIA |
| Cloudinary image URLs | Manual URL string concat | Existing `next/image` + Cloudinary URLs already in product.images | Already standardized in Phase 3 |
| File size formatting | Custom bytes formatter | 5-line utility function is fine | Too simple to justify library |

**Key insight:** For a product page, the complexity is in UX state management (variant selection, zoom, lightbox) not in data transformation. Keep utilities inline; use a library only for the lightbox where accessibility complexity is high.

---

## Common Pitfalls

### Pitfall 1: Variants Without `options` Relation Included
**What goes wrong:** `product.variants[i].options` is undefined; trying to map over it throws.
**Why it happens:** `getBySlug` includes variants with full options nesting. But if the `api.ts` client type is `Product` (which doesn't have variants), TypeScript won't catch missing data.
**How to avoid:** Create a `ProductDetail` type extending `Product` with `variants: ProductVariantWithOptions[]`, `digitalMeta`, `weightedMeta`, `bundleItems`. Use this type for the product page.
**Warning signs:** Runtime errors on `.options.map()` in `VariantSelector`.

### Pitfall 2: `next/image` Requires Configured Domains for Cloudinary
**What goes wrong:** Images from Cloudinary don't render; Next.js throws "hostname not configured" error.
**Why it happens:** `apps/client/next.config.ts` currently has no `images.remotePatterns`.
**How to avoid:** Add Cloudinary domain to `next.config.ts` before writing image components.

```typescript
// apps/client/next.config.ts
const nextConfig: NextConfig = {
  transpilePackages: ['@repo/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};
```

**Warning signs:** `Error: Invalid src prop ... hostname "res.cloudinary.com" is not configured`.

### Pitfall 3: Variant Selection State Doesn't Initialize
**What goes wrong:** Page renders with no variant selected; price/stock show undefined values.
**Why it happens:** VariantSelector starts with empty `selections` state; no variant is "active".
**How to avoid:** Initialize with first available variant's options as default selection. Derive initial selections from `variants[0].options`.

### Pitfall 4: `useCartStore` Called in Server Component
**What goes wrong:** Build error: "useState is not available in Server Components".
**Why it happens:** `add-to-cart-button.tsx` uses `useCartStore` which uses `useState`. If imported from a server component without `'use client'`, it breaks.
**How to avoid:** Every component that calls `useCartStore` or any React hook MUST have `'use client'` at the top.

### Pitfall 5: Frequently Bought Together with No Order History
**What goes wrong:** FBT section renders empty or with fallback in development (seeded data may not have co-purchase history).
**Why it happens:** Order co-occurrence requires real order data that matches current product IDs.
**How to avoid:** The FBT endpoint must return an empty array (not error) when no data exists. UI must gracefully hide the section when `fbtProducts.length === 0`. Do NOT fall back to showing related products in the same section — it confuses the semantics.

### Pitfall 6: `product.attributes` JSONB is Untyped
**What goes wrong:** `Object.entries(product.attributes)` produces values as `any`; rendering arbitrary JSON without display names looks bad.
**Why it happens:** `attributes` is `Json` in Prisma schema → `Record<string, any>` in TypeScript.
**How to avoid:** The specs table must fetch `CategoryAttribute[]` for the product's category (already available from `product.category`) to get display names. Cross-reference attribute key → `CategoryAttribute.name` for labels. Fall back to humanizing the key (replace underscores with spaces, capitalize).

### Pitfall 7: Bundle Item Products Not Fully Included
**What goes wrong:** `bundleItems[i].product` only has partial data (no images) if the include in `getBySlug` doesn't go deep enough.
**Why it happens:** Current `getBySlug` includes `bundleItems: { include: { product: true } }` — this gives all product fields including `images`. This is correct.
**How to avoid:** Verify the bundle item products have images. Use `bundleItem.product.images[0]` with a null check.

---

## Code Examples

### API Client Extensions

```typescript
// apps/client/src/lib/api.ts — add to products object
getRelated: (productId: string, limit = 5) =>
  fetcher<ApiResponse<Product[]>>(`/products/${productId}/related?limit=${limit}`),

getFrequentlyBoughtTogether: (productId: string, limit = 3) =>
  fetcher<ApiResponse<Product[]>>(`/products/${productId}/fbt?limit=${limit}`),
```

### Product Detail Type

```typescript
// apps/client/src/types/product-detail.ts (new file)
import type { Product, ProductVariant, DigitalMeta, WeightedMeta, BundleItem, Category, Brand } from '@repo/types';

export interface VariantOptionData {
  id: string;
  optionId: string;
  option: {
    id: string;
    value: string;
    label?: string;
    groupId: string;
    group: {
      id: string;
      name: string;
      displayName: string;
    };
  };
}

export interface ProductVariantDetail extends ProductVariant {
  options: VariantOptionData[];
}

export interface ProductDetail extends Product {
  category: Category;
  brand?: Brand;
  variants: ProductVariantDetail[];
  digitalMeta?: DigitalMeta;
  weightedMeta?: WeightedMeta;
  bundleItems?: Array<BundleItem & { product: Product }>;
  tags?: Array<{ tagId: string; tag: { name: string; slug: string } }>;
}
```

### File Size Formatter Utility

```typescript
// apps/client/src/lib/utils.ts (create or add to existing)
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
```

### File Type Icon Map

```typescript
// In digital-product-info.tsx
const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: '📄',
  zip: '🗜️',
  mp3: '🎵',
  mp4: '🎬',
  epub: '📚',
  docx: '📝',
  xlsx: '📊',
  png: '🖼️',
  jpg: '🖼️',
  jpeg: '🖼️',
  // Default fallback
  default: '📁',
};
// Usage: FILE_TYPE_ICONS[digitalMeta.fileFormat.toLowerCase()] ?? FILE_TYPE_ICONS.default
// Note: use text icons in dev, replace with SVG icons in final implementation
```

### Bundle Savings Calculation

```typescript
// In bundle-items-list.tsx
function calcBundleSavings(bundlePrice: number, items: Array<{ product: { price: number }; quantity: number }>): number {
  const totalIndividual = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  return Math.max(0, totalIndividual - bundlePrice);
}
// Display: "Save $X.XX vs buying separately"
```

---

## API Endpoints Needed (New)

Two new server endpoints are required:

### GET /api/products/:id/related
- Query: `limit` (default 5)
- Logic: Products sharing `categoryId` OR overlapping tags, excluding the current product
- Response: `ApiResponse<Product[]>`

### GET /api/products/:id/fbt
- Query: `limit` (default 3)
- Logic: MongoDB order co-occurrence aggregation
- Response: `ApiResponse<Product[]>` (empty array if no order history — never 404/500)
- Graceful degradation: if MongoDB unavailable, return `{ success: true, data: [] }`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router `getServerSideProps` for PDP | App Router async Server Components | Next.js 13+ | No prop drilling from SSP; direct async/await |
| Client-side fetch for initial product data | Server Component fetch | Next.js 13+ | No loading flicker on initial render |
| `react-image-lightbox` (unmaintained) | `yet-another-react-lightbox` | 2022 onwards | Better accessibility, maintained |
| Redux for variant state | `useState` in client component | 2020+ | Simpler; no global state needed for PDP |

**Deprecated/outdated:**
- `react-image-lightbox`: last release 2021, not maintained — do not use
- `next/router` (Pages Router): project uses App Router `next/navigation`

---

## Open Questions

1. **Category attributes for specs table: should they be fetched separately or are they included?**
   - What we know: `product.category` is included by `getBySlug`; but `CategoryAttribute` records for that category are not included.
   - What's unclear: Should the product page make a separate request for `CategoryAttribute` definitions, or should `getBySlug` include them?
   - Recommendation: Add `category: { include: { attributes: true } }` to the `getBySlug` include block so specs table has display names in one request. This adds minimal data overhead.

2. **Stock for SIMPLE products (no variants)**
   - What we know: `ProductVariant.stock` is per-variant. SIMPLE products may have one variant or zero variants in the schema.
   - What's unclear: Current seed data structure for simple products — do they have a single variant entry?
   - Recommendation: Check `product.variants.length === 0` case; if no variants, derive stock from a future `product.stock` field or display "Contact for availability". For Phase 7, assume simple products have at least one variant (standard e-commerce pattern). Document this assumption.

3. **FBT algorithm threshold**
   - What we know: Claude's discretion per CONTEXT.md.
   - Recommendation: Set minimum co-occurrence count = 2 (product must appear together with current product in at least 2 orders). Return max 3 items. No minimum order count threshold in Phase 7 — full algorithm is future scope.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (workspace root vitest.config.ts) |
| Config file | `/vitest.config.ts` (workspace root) |
| Quick run command | `pnpm vitest run tests/products/product-page.test.ts` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PDPG-01 | Gallery renders images, thumbnails switch active image | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ Wave 0 |
| PDPG-02 | Variant selection updates price, SKU, stock | unit | `pnpm vitest run tests/products/variant-selector.test.ts` | ❌ Wave 0 |
| PDPG-03 | Specs table renders attributes with category labels | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ Wave 0 |
| PDPG-04 | Related products API returns same-category products | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ Wave 0 |
| PDPG-05 | FBT section renders checkboxes; add-all calls cart store | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ Wave 0 |
| PDPG-06 | Reviews section renders rating distribution | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ Wave 0 |
| PDPG-07 | Stock status shows correct label for stock values | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ Wave 0 |
| PDPG-08 | Weight slider updates total price in real-time | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ Wave 0 |
| PDPG-09 | Digital info shows file icon, size, format | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ Wave 0 |
| PDPG-10 | Bundle shows savings callout with correct math | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ Wave 0 |
| Related API | getRelated() returns products from same category | unit | `pnpm vitest run tests/products/product-service-related.test.ts` | ❌ Wave 0 |
| FBT API | getFBT() returns empty array with no order data | unit | `pnpm vitest run tests/products/product-service-fbt.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run tests/products/`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/products/product-page.test.ts` — covers PDPG-01 through PDPG-10
- [ ] `tests/products/variant-selector.test.ts` — covers PDPG-02 variant combination logic
- [ ] `tests/products/product-service-related.test.ts` — covers getRelated() server logic
- [ ] `tests/products/product-service-fbt.test.ts` — covers getFBT() server logic

---

## Existing Code to Reuse

Critical assets already built that Phase 7 directly uses:

| Asset | Path | Phase 7 Usage |
|-------|------|---------------|
| `ProductCard` | `apps/client/src/components/product/product-card.tsx` | Related products carousel + FBT section |
| `StarRating` | `apps/client/src/components/ui/star-rating.tsx` | Reviews section + product header rating |
| `useCartStore` | `apps/client/src/stores/cart-store.ts` | Add-to-cart, add-all-to-cart buttons |
| `api.products.getBySlug` | `apps/client/src/lib/api.ts` | Product page data fetch |
| `formatPrice` pattern | Multiple files | `(cents / 100).toFixed(2)` with dollar sign |
| Loading skeleton pattern | `apps/client/src/app/products/loading.tsx` | Template for `[slug]/loading.tsx` |
| `next/image` + Cloudinary | Phase 3 decision | All product images |

---

## Sources

### Primary (HIGH confidence)
- Project codebase: `apps/server/src/modules/product/product.service.ts` — confirmed getBySlug includes variants, options, groups, digitalMeta, weightedMeta, bundleItems
- Project codebase: `packages/db/prisma/schema.prisma` — confirmed ProductVariant, VariantOption, OptionValue, OptionGroup schema
- Project codebase: `packages/types/src/index.ts` — confirmed Product, ProductVariant, DigitalMeta, WeightedMeta, BundleItem type shapes
- Project codebase: `apps/client/src/stores/cart-store.ts` — confirmed CartItem interface shape for addItem()
- Project codebase: `apps/client/src/lib/api.ts` — confirmed existing endpoints, established fetcher pattern
- Project codebase: `vitest.config.ts` + `tests/setup.ts` — confirmed Vitest 4.x, prismaMock pattern, test directory structure

### Secondary (MEDIUM confidence)
- `yet-another-react-lightbox` NPM page and GitHub — actively maintained, last release 2024, accessibility-first design. Library ID confirmed via npm search (March 2026)
- Next.js App Router docs pattern — async Server Components + `notFound()` — matches Next.js 14/15/16 App Router conventions used in existing codebase

### Tertiary (LOW confidence)
- CSS hover zoom pattern — described from training knowledge; no external verification performed. Pattern is standard and well-understood.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed except yet-another-react-lightbox; existing patterns confirmed from codebase
- Architecture: HIGH — follows established server-component-with-client-islands pattern from Phase 3 decision
- API data shape: HIGH — read actual service code and schema
- Pitfalls: HIGH — derived from actual code analysis (missing next.config image domains, variant type gaps)
- FBT algorithm: MEDIUM — MongoDB aggregation pattern is standard; co-occurrence threshold is Claude's discretion

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (stable domain; Next.js App Router pattern stable)
