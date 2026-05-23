# Phase 23: E-Commerce UI Design System — Research

## 1. Luxury/Minimalist UI Patterns (Zara, COS, Aesop, Apple, SSENSE)

### Design Principles
1. **Minimal chrome:** No rounded corners on cards (border-radius: 0), no shadows, no borders. Product photography dominates.
2. **Tight grid gaps:** 1-8px between items (Everlane: 8px, Zara: ~0).
3. **Typography-driven:** Large serif headings, small uppercase sans-serif labels. Generous letter-spacing.
4. **Image-first:** Portrait 3:4 aspect ratios for fashion. Image swap on hover is standard.
5. **Subdued interactions:** No heavy hover shadows. Subtle opacity/crossfade. No bounce/scale.
6. **Black & white palette:** Primary buttons are black, not blue. Accent colors only for sale/error.
7. **Full-width layouts:** Edge-to-edge images. Max-width only for text content.

### Header / Navigation Patterns
- **Zara/COS/Massimo Dutti:** Transparent header over hero, centered logo, solid on scroll
- **Apple:** Compact 48px nav bar, inline search, cart badge + dropdown
- **SSENSE:** Minimal black header, fullscreen search overlay, cart drawer
- **Aesop:** Hamburger even on desktop, fullscreen navigation panel

### Hero / Landing Patterns
- **Zara:** Full-bleed 100vh hero with autoplay muted video, minimal text, no CTA button
- **COS:** Split hero 50/50 (image + text), serif typography, text link CTA
- **Apple:** Horizontal product shelf carousels, large headline + dual CTAs
- **SSENSE:** Editorial asymmetric image grids, magazine-like

### Product Listing (PLP) Patterns
- **Zara:** 2/3/4-col grid, no Add to Cart on card, image swap on hover, infinite scroll
- **COS:** 3-col grid, crossfade on hover, quick-add appears on hover
- **Everlane:** Tight 8px gap, zero border-radius, left-aligned text, no shadows

### Product Detail (PDP) Patterns
- **Zara/COS:** Vertical image scroll (sticky left), info panel right, accordion for details
- **Apple:** Step-by-step configuration, hero changes per selection
- **Everlane:** Multi-image gallery, size buttons, materials accordion

### Cart & Checkout Patterns
- **Common:** Cart drawer (right slide-in), 400px desktop / full-width mobile
- **Everlane:** Drawer with Apple Pay integration, redirect home if empty
- **Zara:** Clean items, size/color shown, promo code input

---

## 2. Component Inventory (~65-75 total)

### Header (14 components)
| Component | Description |
|---|---|
| `SiteHeader` | Sticky, transparent-to-solid on scroll, height collapse |
| `AnnouncementBar` | Dismissible promo banner, auto-rotate messages, 32-36px |
| `Logo` | SVG, light/dark variants for transparent header |
| `MainNav` | Horizontal nav links, triggers MegaMenu on hover |
| `MegaMenu` | Full-width dropdown, 3-4 columns, featured image slot, animated |
| `MegaMenuColumn` | Heading + link list within mega menu |
| `MegaMenuFeatureCard` | Campaign image card within mega menu |
| `SearchOverlay` | Fullscreen search, trending/recent/live results, keyboard nav |
| `SearchSuggestions` | Dropdown with trending, recent, autocomplete |
| `CartDrawer` | Right slide-in sheet, items + subtotal + checkout CTA |
| `CartBadge` | Icon button with animated count badge |
| `UserMenu` | Dropdown: orders, wishlist, settings, sign out |
| `MobileMenuDrawer` | Full-height left slide-in, accordion categories, focus trap |
| `HeaderActions` | Right-side icon group: search, account, wishlist, cart |

### Hero / Landing (12 components)
| Component | Description |
|---|---|
| `HeroFullBleed` | 100vh, background image/video, text overlay, gradient |
| `HeroSplit` | 50/50 image + content, reversible |
| `HeroVideo` | Autoplay muted loop, lazy load, poster fallback |
| `CampaignBanner` | Full-width image + centered text, 50-70vh |
| `CategoryGrid` | 2x2 or 3-col grid of category cards |
| `CategoryCard` | Image background + text overlay + hover zoom |
| `EditorialSection` | Asymmetric lookbook/magazine layout |
| `ShopTheLook` | Image with hotspot markers → product popups |
| `ProductCarousel` | Horizontal scroll + snap + arrows, for "New Arrivals" etc |
| `SectionHeading` | Title + subtitle + "View All" link, uppercase tracking-wide |
| `NewsletterSignup` | Email input + submit, "Join our world" |
| `TrustBar` | Icons row: free shipping, easy returns, secure checkout |

### Product Listing (14 components)
| Component | Description |
|---|---|
| `ProductGrid` | 2/3/4-col responsive, tight gaps |
| `ProductCard` | No border/shadow/radius, image swap on hover, brand name above |
| `ProductCardImage` | 3:4 aspect ratio, crossfade hover, lazy load |
| `ProductCardQuickAdd` | Appears on hover, "+" icon or size selector |
| `ProductCardWishlist` | Heart icon, absolute top-right |
| `ProductCardBadge` | "New", "Sale", "-30%" top-left |
| `ColorSwatches` | Small circles on card, changes image, max 4-5 + overflow |
| `FilterTopBar` | Horizontal filter bar above grid (Zara/SSENSE pattern) |
| `SortDropdown` | Featured, Price, Newest, Best Selling |
| `ProductCount` | "Showing 48 of 234 products" |
| `InfiniteScrollTrigger` | IntersectionObserver, triggers next page, spinner |
| `QuickViewModal` | Modal: images + size select + add to cart |
| `PLPSkeleton` | Grid of pulsing gray rectangles |
| `ViewToggle` | Grid/list view switch |

### Product Detail (18 components)
| Component | Description |
|---|---|
| `PDPLayout` | Two-column: sticky gallery left, scrollable info right |
| `ImageGallery` | Vertical stack (desktop) / horizontal swipe (mobile) |
| `ImageGalleryThumbnails` | Vertical strip, click to jump, active indicator |
| `ImageZoom` | Hover magnify + click fullscreen |
| `ImageLightbox` | Fullscreen overlay, swipeable, counter "3/7" |
| `ProductInfo` | Container for title, price, selectors, CTA, accordions |
| `ProductTitle` | Brand (small uppercase) + name (large) + tagline |
| `ProductPrice` | Current + compare-at (strikethrough) + discount badge + installment |
| `SizeSelector` | Size buttons row, disabled for OOS, "Size Guide" link |
| `SizeGuideModal` | Measurement table, tabs in/cm, body diagrams |
| `ColorSelector` | Color swatches 24-32px, tooltip, changes gallery |
| `QuantitySelector` | -/+ buttons with input |
| `AddToCartButton` | Full-width, loading spinner, "Added!" checkmark |
| `WishlistButton` | Heart icon toggle beside Add to Cart |
| `ProductAccordion` | Description, Materials, Sizing, Shipping sections |
| `StockIndicator` | "Only 3 left" / "In Stock" with colored dot |
| `DeliveryEstimate` | "Free delivery by Thu, Mar 15" with truck icon |
| `CompleteTheLook` | Styled-with product carousel |

### Cart & Checkout (10 components)
| Component | Description |
|---|---|
| `CartLineItem` | Thumbnail + name + variant + quantity + price + remove |
| `CartSummary` | Subtotal, shipping, taxes, total |
| `CartEmpty` | Illustration + "Your cart is empty" + CTA |
| `PromoCodeInput` | Expandable input + Apply button |
| `ExpressCheckout` | Apple Pay, Google Pay, Shop Pay buttons row |
| `CheckoutLayout` | Multi-step: Information → Shipping → Payment → Review |
| `CheckoutStepIndicator` | Breadcrumb-style progress |
| `OrderSummary` | Sticky sidebar, collapsible on mobile |
| `AddressForm` | Standard form fields |
| `OrderConfirmation` | Success: checkmark, order number, summary |

### Shared / Base (10+ components)
| Component | Description |
|---|---|
| `SiteFooter` | 4-column links + newsletter, accordion on mobile |
| `FooterLinkGroup` | Column heading + links, expandable mobile |
| `CountrySelector` | Flag + country dropdown |
| `BackToTop` | Fixed bottom-right, appears after 500px scroll |
| `Toast` | Slide-in notification, auto-dismiss 3-5s |
| `CookieConsent` | Bottom banner, Accept/Customize |
| `EmptyState` | Icon + heading + description + CTA |
| `LoadingSkeleton` | SkeletonText, SkeletonImage, SkeletonCard |
| `Spinner` | Small/medium/large variants |
| `VisuallyHidden` | Screen-reader-only text |

---

## 3. Technology Stack Recommendations

### Core UI Framework
| Need | Library | Why |
|---|---|
| **Component primitives** | shadcn/ui (Radix + Tailwind) | Code ownership, mockups → production |
| **E-commerce blocks** | CommerCN + commerce-ui | shadcn-native, copy-paste, MIT |
| **Tailwind patterns** | HyperUI (free) / Tailwind Plus (paid) | Pre-built e-commerce sections |

### Animation & Interaction
| Need | Library | Notes |
|---|---|---|
| **Page transitions** | Motion v12 (ex Framer Motion) | React 19 + Next.js 16 tested |
| **Scroll animations** | GSAP (free!) + ScrollTrigger | Now fully free including premium plugins |
| **Smooth scroll** | Lenis (9K+ stars) | Industry standard, GSAP/Motion compatible |
| **Carousels** | Embla Carousel | Already in shadcn/ui, lightweight |

### Product Media
| Need | Library | Notes |
|---|---|---|
| **Image lightbox** | yet-another-react-lightbox | React 19, zoom plugin, Next.js support |
| **Hover zoom** | react-inner-image-zoom | Lightweight, Amazon-style |
| **Image optimization** | next/image | Built-in, blur placeholders, responsive sizes |

### Reference Projects
| Project | Stars | Stack | Value |
|---|---|---|---|
| Vercel Commerce | ~14K | Next.js App Router, RSC | Architecture reference |
| NextFaster | — | Next.js, Drizzle, PPR | Performance patterns |
| Relivator | ~1.5K | Next.js 15, shadcn/ui, Drizzle | Closest stack match |

### Figma Design References
- Minimal E-Commerce App Design System (Figma Community)
- E-Commerce UI Essentials (400+ components)
- Vercel Geist Design System (minimalist typography/spacing)

---

## 4. Component Architecture

### Organization: Hybrid (shared ui/ + domain folders)
```
src/components/
  ui/           # shadcn/ui primitives (Button, Input, Badge, Sheet, Dialog, etc.)
  layout/       # SiteHeader, SiteFooter, MobileMenuDrawer
  product/      # ProductCard, ProductGrid, ImageGallery, VariantPicker
  cart/         # CartDrawer, CartLineItem, CartSummary
  checkout/     # CheckoutForm, PaymentSection, ShippingForm
  filters/      # (already exists)
  search/       # (already exists)
  navigation/   # (already exists)
  sections/     # HeroFullBleed, HeroSplit, CategoryGrid, EditorialSection
```

### Layout Architecture (Route Groups)
```
app/
  layout.tsx              # Root: <html>, <body>, providers only
  (shop)/
    layout.tsx            # Shop: Header, Footer, CartDrawer
    @modal/               # Parallel route for quick view modals
      default.tsx
      (.)products/[slug]/page.tsx
    page.tsx              # Homepage
    products/
    categories/[slug]/
  (checkout)/
    layout.tsx            # Minimal: logo + progress steps
  (account)/
    layout.tsx            # Sidebar nav + header
  (auth)/
    layout.tsx            # Centered, no nav
```

### Server vs Client Components
**Server (default):** ProductGrid, ProductPage, CategoryPage, Header data, Footer, Breadcrumbs
**Client ("use client"):** CartDrawer, SearchBar, ImageGallery, VariantPicker, QuantitySelector, FilterSidebar, AddToCartButton, MobileNav

### Mock Data Strategy
- Static typed mock functions mirroring `api.ts` interface
- Curated product data (not random Faker.js) for luxury aesthetic
- Toggle via `NEXT_PUBLIC_USE_MOCKS=true` env var
- Same TypeScript types from `@repo/types`

---

## 5. Tailwind v4 Theme (Minimalist Luxury)

```css
@theme {
  /* Typography */
  --font-sans: "Inter", "Helvetica Neue", system-ui, sans-serif;
  --font-display: "Editorial New", "Times New Roman", serif;

  /* Colors: OKLCH neutral-first with black accent */
  --color-foreground: oklch(0.210 0.004 90);
  --color-foreground-muted: oklch(0.560 0.010 90);
  --color-background: oklch(0.995 0.000 0);
  --color-surface: oklch(0.985 0.002 90);
  --color-border: oklch(0.925 0.006 90);
  --color-accent: oklch(0.200 0.000 0);        /* Near-black CTA */
  --color-accent-foreground: oklch(0.990 0.000 0);

  /* Transitions */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 500ms;
}
```

---

## 6. UI Style Variants (for user selection)

During planning, present ~10 UI style directions:
1. **Zara Minimal** — B&W, no borders, image-first, editorial
2. **Apple Clean** — Rounded, spacious, product-focused, gradient accents
3. **SSENSE Editorial** — Magazine-like, asymmetric, typography-heavy
4. **COS Scandinavian** — Warm neutrals, serif headings, generous whitespace
5. **Aesop Warm** — Earth tones, warm palette, story-driven
6. **Everlane Honest** — Clean grid, mission-driven, transparent pricing
7. **Nike Bold** — High contrast, dynamic, motion-heavy
8. **Muji Japanese Minimal** — Ultra-minimal, natural colors, quiet
9. **Acne Studios Art** — Fashion-forward, unexpected layouts, creative
10. **NET-A-PORTER Luxury** — Gold accents, serif typography, editorial grid

User selects preferred direction → design tokens + component styling follows.
