# Universal E-Commerce Template

## What This Is

A professional, universal e-commerce application template built as a Turborepo monorepo. It provides a scalable, production-ready architecture for building any type of online store — from simple product shops to complex multi-variant, multi-warehouse marketplaces. The template includes a Next.js customer storefront, an admin panel, and an Express API backend, all sharing types and database packages.

## Core Value

A single template that handles every possible e-commerce scenario (simple products, variable products with option combinations, weighted products, digital goods, bundled products) without needing architectural changes — developers start building features, not infrastructure.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Turborepo monorepo with pnpm workspaces — existing
- ✓ Express 5 backend with modular architecture (controller/service/routes pattern) — existing
- ✓ Next.js 16 client app with basic layout and Zustand cart store — existing
- ✓ Next.js 16 admin app with sidebar dashboard — existing
- ✓ Prisma + PostgreSQL for relational data (User, Product, Category, ProductVariant) — existing
- ✓ Mongoose + MongoDB for order documents — existing
- ✓ Shared TypeScript types package — existing
- ✓ Docker Compose for local PostgreSQL and MongoDB — existing
- ✓ Event bus for cross-module communication — existing
- ✓ Centralized error handling middleware — existing
- ✓ API client wrappers for frontend apps — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] Complete database schema design (infinite category tree, dynamic attributes, all product types, all entity models)
- [ ] Authentication system via Clerk (register, login, OAuth, profile) in server + client + admin
- [ ] Product catalog with all product types (simple, variable, weighted, digital, bundled) — admin CRUD + client display
- [ ] Infinite depth category tree with collections, brands, tags, mega menu, breadcrumbs
- [ ] Search system via Algolia/Meilisearch (full-text, autocomplete, suggestions)
- [ ] Dynamic attribute-based filter system with price range, multi-select, URL state persistence
- [ ] Product page with image gallery, variant selector, specs, related products, frequently bought together
- [ ] Wishlist management and product comparison with specification differences
- [ ] Cart system with guest + auth support, persistent cart, coupon application
- [ ] Multi-step checkout with address selection, shipping method, payment selection
- [ ] Stripe payment integration (cards, Apple Pay, Google Pay, webhooks)
- [ ] Order lifecycle management (pending → delivered), tracking, invoices, returns
- [ ] Shipping system with zones, methods, rate calculation, tracking numbers
- [ ] Inventory management with stock tracking, low stock alerts, SKU management, multi-warehouse
- [ ] Promotions and discounts (coupons, percentage/fixed/bulk, BOGO, flash sales)
- [ ] Reviews and ratings with photo uploads, moderation, spam filtering
- [ ] Notification system via Resend (order emails, shipping updates, abandoned cart)
- [ ] Analytics dashboard (revenue, conversion, best sellers, customer insights)
- [ ] SEO features (meta tags, canonical URLs, sitemap, structured data)
- [ ] Multi-store support (multi-language, multi-currency, multi-region)
- [ ] Complete admin panel for all modules

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Mobile app — Web-first template, mobile can be added via React Native later
- Real-time chat / customer support — High complexity, better as separate service integration
- Marketplace (multi-vendor) — Different architecture entirely, would dilute template focus
- CMS / Blog — Not core e-commerce, easily added via headless CMS integration
- AR product preview — Experimental, device-dependent, low ROI for template

## Context

This is a brownfield project with existing foundational code:
- Backend has 4 modules (product, order, auth, payment) with placeholder integrations
- Frontend apps have basic layouts but no feature pages or components
- Database schemas are minimal — need significant expansion for production use
- Auth middleware is placeholder (accepts any Bearer token)
- Payment service returns mock data
- No tests, no search, no filters, no UI components beyond basic layout
- No input validation despite Zod being installed

Key architectural decisions already made:
- Dual database: PostgreSQL (products, users, categories) + MongoDB (orders)
- ESM throughout with .js extensions in Node imports
- Singleton service pattern with event-driven cross-module communication
- shadcn/ui planned for UI components but not yet installed

## Constraints

- **Tech Stack**: Next.js 16, React 19, Express 5, Prisma, Mongoose, Tailwind CSS 4, shadcn/ui — already established
- **Services**: Clerk (auth), Stripe (payments), Cloudinary (media), Algolia/Meilisearch (search), Resend (emails) — specified in spec
- **Monorepo**: Turborepo with pnpm workspaces — already established
- **Databases**: PostgreSQL 16 + MongoDB 7 via Docker — already established
- **Implementation**: Every feature must be implemented in BOTH admin and client apps where applicable
- **Template Quality**: Must be professional-grade, handling all edge cases for each product type

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dual DB (PostgreSQL + MongoDB) | Relational for products/users, document for orders | — Pending |
| Clerk for auth | Managed auth reduces implementation complexity | — Pending |
| Stripe for payments | Industry standard, comprehensive API | — Pending |
| One feature per phase | Allows focused implementation and testing | — Pending |
| Research before each phase | Ensures professional-grade patterns | — Pending |
| shadcn/ui for components | Customizable, accessible, modern | — Pending |

---
*Last updated: 2026-03-10 after initialization*
