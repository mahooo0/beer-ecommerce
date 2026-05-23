# Research Summary

**Domain:** Universal E-Commerce Template
**Researched:** 2026-03-10

## Key Findings

### Stack Recommendations
- **Auth:** @clerk/nextjs ^7.0.1 + @clerk/backend (native Next.js 16 Server Components support)
- **Payments:** stripe ^20.4.1 + @stripe/stripe-js ^5.x (Embedded Checkout, webhook-driven)
- **Media:** next-cloudinary ^8.x + cloudinary ^2.x (CldImage, CldUploadWidget, signed uploads)
- **Search:** meilisearch ^0.55.0 (self-hosted, free, <50ms, typo tolerance) — Algolia as enterprise alternative
- **Email:** resend ^6.9.3 + react-email ^5.2.9 (React templates, Server Actions compatible)
- **UI:** shadcn/ui CLI v4 (copy-paste components, Radix UI, Tailwind CSS 4)
- **Cache:** ioredis ^5.x (BullMQ compatible, connection pooling, Pub/Sub)
- **Avoid:** next-auth, cloudinary-react, nodemailer, node-redis for job queues

### Architecture Patterns
- **Category Tree:** Materialized Path (string like `/electronics/computers/laptops`) — NOT nested set or adjacency list
- **Product Attributes:** PostgreSQL JSONB columns with GIN indexes — NOT EAV pattern (1000x faster)
- **Variants:** Parent-child model with option combinations, selective creation (not all combos)
- **Inventory:** Multi-warehouse with atomic stock reservation (TTL-based, 15min expiry)
- **Promotions:** Rule-based engine with conditions/actions stored as data, stackability support
- **Events:** Event-driven architecture for cross-module communication (order→inventory→payment)
- **Dual DB Strategy:** PostgreSQL for products/users/categories, MongoDB for orders — requires saga pattern for consistency

### Table Stakes Features
- Product catalog with variants (size/color/material)
- Guest + authenticated checkout
- Cart with persistence
- Payment processing (cards, Apple Pay, Google Pay)
- Order lifecycle management
- Basic search and filtering
- Product reviews and ratings
- Wishlist
- Email notifications (order confirmation, shipping)
- SEO (meta tags, canonical URLs, structured data)
- Responsive design
- Saved addresses

### Differentiators
- Dynamic attribute-based filtering per category
- Multi-warehouse intelligent routing
- Advanced stock reservation (prevents overselling)
- Advanced promotions engine (BOGO, tiered, flash sales)
- Abandoned cart recovery (multi-channel)
- Product bundles and digital products
- Subscription products
- Multi-currency/language support

### Critical Pitfalls to Avoid
1. **Price manipulation** — NEVER trust client-submitted prices, always recalculate server-side
2. **Inventory race conditions** — Use atomic Prisma transactions with conditional WHERE clause
3. **Webhook signature bypass** — Always verify Stripe signatures with raw body
4. **Category N+1 queries** — Use recursive CTE or materialized path, NOT recursive function calls
5. **EAV for attributes** — Use JSONB columns instead (1000x performance difference)
6. **Dual DB inconsistency** — Implement saga pattern with compensation for cross-database operations
7. **Missing RBAC** — Design role-based permissions before building admin panel

### Build Order (Dependencies)
1. Database schema expansion (foundation for everything)
2. Authentication (Clerk integration, required for protected features)
3. Product catalog + variants (core domain)
4. Categories + navigation (product organization)
5. Search + filters (product discovery)
6. Cart + checkout (purchase flow)
7. Payments (Stripe integration)
8. Orders + inventory (fulfillment)
9. Promotions + discounts
10. Reviews + ratings
11. Notifications (email)
12. Analytics + SEO
13. Admin panel (all modules)
14. Multi-store features

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Dual DB consistency issues | HIGH | HIGH | Implement saga pattern from Phase 1, add reconciliation jobs |
| Express 5 breaking changes | MEDIUM | MEDIUM | Pin version, monitor release notes |
| Next.js 16 proxy.ts migration | MEDIUM | LOW | Follow Clerk migration guide for proxy.ts |
| Variant combination explosion | MEDIUM | MEDIUM | Selective variant creation, not auto-generate all combos |
| Search index sync failures | LOW | MEDIUM | Event-driven sync with retry queue, manual re-index endpoint |

## Files
- `STACK.md` — Technology recommendations with versions and rationale
- `FEATURES.md` — Table stakes, differentiators, anti-features with dependencies
- `ARCHITECTURE.md` — Component patterns, data flow, build order
- `PITFALLS.md` — Domain-specific pitfalls with prevention strategies

---
*Research synthesis: 2026-03-10*
