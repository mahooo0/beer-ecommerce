# Phase 7: Product Page - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Each product type (simple, variable, weighted, digital, bundled) gets a rich, dedicated detail page with image gallery, variant selection, specifications/attributes table, related products carousel, "frequently bought together" section, reviews display, real-time stock status, and type-specific displays. This is the client-facing product detail page only — admin product management was completed in Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Image Gallery & Lightbox
- Large hero image with horizontal thumbnail strip below
- Hover zoom (magnifier lens) on desktop — shows zoomed-in portion on mouse hover
- Mobile gets pinch-to-zoom instead of hover zoom
- Click main image or fullscreen icon opens dark overlay lightbox with arrow key + swipe navigation
- Mobile gallery: swipeable horizontal carousel with dot indicators

### Variant Selector
- All option types (color, size, material, etc.) use dropdown menus — consistent and compact
- Selecting a variant swaps the gallery to variant-specific images (falls back to product images if variant has none)
- Price, stock status, and SKU update dynamically when variant is selected
- Unavailable variant combinations shown as disabled (grayed out) in dropdowns — visible but unselectable

### Related Products
- Auto-generated from products sharing the same category or tags — no manual curation
- Displayed as a horizontal scrollable carousel with arrows
- Shows 4-5 ProductCards on desktop, 2 on mobile
- Reuses existing ProductCard component

### Frequently Bought Together
- Auto-generated from order history analysis — products commonly purchased together
- Each suggested item has a checkbox (all checked by default)
- User can uncheck items they don't want
- "Add selected to cart" button shows total price for selected items

### Type-Specific Displays
- **Layout approach:** Single product page layout with conditional type-specific sections — not separate pages per type
- **Weighted products:** Slider + input field for quantity (e.g., 0.1kg to 10kg). Price updates in real-time. Unit price (price per kg/lb) shown prominently
- **Digital products:** Visual file type icon (PDF, ZIP, MP3) + file size + format name + delivery method ("Instant download after purchase"). Clear "no shipping required" indicator
- **Bundle products:** List of included items with thumbnails, names, individual prices. Shows total if bought separately vs bundle price with savings callout

### Stock Status Display
- Real-time stock status: "In Stock", "Low Stock (X left)", "Out of Stock"
- Stock status shown near the add-to-cart button area

### Specifications/Attributes Table
- Two-column table showing product attributes from JSONB `attributes` field
- Category-specific attributes displayed based on product's category

### Reviews Section
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

</decisions>

<specifics>
## Specific Ideas

- Gallery should feel like a standard e-commerce product page (Amazon/Shopify style) — proven patterns
- All product types should feel cohesive — same page structure, just different sections appearing based on type
- Frequently bought together should gracefully handle products with no order history (show nothing or fall back to related products)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ProductCard` component (`apps/client/src/components/product/product-card.tsx`): Used for related products carousel and frequently bought together section
- `StarRating` component (`apps/client/src/components/ui/star-rating.tsx`): Used for reviews display and product rating
- `ProductGrid` component: Can reference grid patterns for carousel layout
- `cart-store.ts` (Zustand): Cart store for add-to-cart functionality
- `api.ts` client library: API client for fetching product data

### Established Patterns
- Server Components for data fetching with client islands for interactivity (Phase 3 decision)
- Tailwind CSS for all styling — no shadcn/ui (Phase 6 decision)
- `formatPrice` pattern: `(cents / 100).toFixed(2)` with dollar sign
- Product images served via Cloudinary with `next/image` for optimization
- Prices stored as integer cents (Phase 1)

### Integration Points
- Product detail route: `apps/client/src/app/products/[slug]/page.tsx`
- Server API: `getBySlug` endpoint already exists in product service with full includes (variants, category, brand, tags)
- Cart integration: Zustand store at `apps/client/src/stores/cart-store.ts`
- Navigation: ProductCard already links to `/products/${product.slug}`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-product-page*
*Context gathered: 2026-03-11*
