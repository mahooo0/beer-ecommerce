# E-Commerce Template Pitfalls

**Domain:** Universal E-Commerce Platform
**Researched:** 2026-03-10
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Product Variant Orphaning and Inconsistent Attributes

**What goes wrong:**
Product variants become "orphaned" (listed as separate products) due to inconsistent attribute naming. Using "Gray," "Grey," and "Heather Grey" interchangeably creates three separate filters on the shopping site, splitting inventory and confusing customers. A simple typo or case-sensitivity issue (e.g., "Tshirt" vs "tshirt") can cause a variant to appear as a completely different product.

**Why it happens:**
Developers create flexible string-based attribute systems without validation, allowing manual data entry without normalization. No enum enforcement means attributes drift over time as different admin users enter data slightly differently.

**How to avoid:**
- Use database enums or lookup tables for variant attributes (color, size, material)
- Implement attribute normalization middleware that converts input to canonical form
- Add database constraints preventing duplicate parent-child relationships
- Validate variant attributes against predefined sets before save
- Use strict TypeScript discriminated unions for variant option types

**Warning signs:**
- Search results showing duplicate products with slight naming differences
- Filter dropdowns containing "Red", "red", "RED" as separate options
- Products with zero variants when they should have many
- Parent products appearing in product listings (should only show purchasable children)

**Phase to address:**
Phase: Product Catalog Implementation (must be in schema design from start)

**Sources:**
- [Managing Product Variant Complexity in E-Commerce Systems](https://medium.com/@vanshitpatel10/managing-product-variant-complexity-in-e-commerce-systems-7fb281b63ce6)
- [Common Product Variation Mistakes](https://www.exeideas.com/2026/01/common-product-variation-mistakes.html)

---

### Pitfall 2: Race Conditions in Cart-to-Order Inventory Deduction

**What goes wrong:**
Two customers simultaneously purchase the last item in stock. Both get confirmation emails. When fulfillment begins, there's only one unit available. One order must be cancelled, damaging customer trust. In high-traffic scenarios, overselling can occur at scale, creating fulfillment nightmares.

**Why it happens:**
Order creation and inventory deduction happen in separate steps without atomic transactions. The typical broken flow: (1) Read current stock: 1 unit, (2) Create order, (3) Decrement stock. Between steps 1 and 2, another request reads the same stock value. Both proceed to create orders.

**How to avoid:**
```typescript
// CORRECT: Atomic decrement with transaction
await prisma.$transaction(async (tx) => {
  const variant = await tx.productVariant.update({
    where: { id: variantId, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } }
  });

  if (!variant) {
    throw new Error('Insufficient stock');
  }

  await tx.order.create({ /* order data */ });
});

// WRONG: Read-then-decrement (race condition)
const variant = await prisma.productVariant.findUnique({ where: { id } });
if (variant.stock >= quantity) {
  await prisma.order.create({ /* order data */ });
  await prisma.productVariant.update({
    data: { stock: variant.stock - quantity }
  });
}
```

**Warning signs:**
- Customer complaints about cancelled orders for "in-stock" items
- Negative stock values in database
- Order count exceeds initial inventory for limited releases
- Database logs showing concurrent updates to same product variant

**Phase to address:**
Phase: Cart & Checkout Implementation (must implement atomic transactions from day one)

**Sources:**
- [Key Considerations in Object-Oriented Design: Online Shopping Cart System](https://medium.com/@bugfreeai/key-considerations-in-object-oriented-design-online-shopping-cart-system-6ab7cc9a3697)
- [Manage inventory with the Cart](https://docs.commercetools.com/learning-model-your-product-catalog/inventory-modeling/cart-inventory)

---

### Pitfall 3: Price Manipulation via Client-Submitted Order Totals

**What goes wrong:**
Frontend sends order with items and total amount. Backend trusts the total without recalculation. Malicious user modifies request to send $0.01 total for $500 cart. Order processes. Revenue lost. This is the e-commerce equivalent of letting customers write their own receipt.

**Why it happens:**
Developers assume the frontend is trusted or forget that all client data is attacker-controlled. Quick prototyping accepts order.total from request body to save a database query. No server-side price validation means modified requests go undetected.

**How to avoid:**
```typescript
// CORRECT: Server calculates total
async createOrder(items: OrderItem[]) {
  const total = await this.calculateTotal(items); // fetch prices from DB

  // Verify each item price matches current product variant price
  for (const item of items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId }
    });

    if (variant.price !== item.price) {
      throw new Error(`Price changed for ${variant.name}`);
    }
  }

  return prisma.order.create({
    data: { items, total } // use calculated total
  });
}

// WRONG: Trust client total
async createOrder(orderData: { items, total }) {
  return prisma.order.create({ data: orderData }); // uses client total
}
```

**Warning signs:**
- Orders with suspiciously low totals
- Audit logs showing orders at $0.00 or $0.01
- Revenue doesn't match order item quantities × prices
- No price validation in order creation service

**Phase to address:**
Phase: Checkout & Order Creation (implement in first iteration, cannot be added later as patch)

**Sources:**
- [eCommerce Order Management Process](https://www.invensis.net/blog/ecommerce-order-management-process)
- [Common ecommerce security vulnerabilities](https://securityboulevard.com/2026/03/common-ecommerce-security-vulnerabilities-and-testing-strategies/)

---

### Pitfall 4: Webhook Signature Verification Bypass

**What goes wrong:**
Stripe webhook endpoint accepts any POST request without signature verification. Attacker sends fake "payment_succeeded" webhook. Backend marks order as paid. Product ships. No payment received. This vulnerability allows anyone who knows your webhook URL to mark orders as paid.

**Why it happens:**
Developers implement webhook parsing before understanding signature verification. Testing with manual POST requests works without signatures. Moving to production without implementing Stripe signature verification. Documentation is skipped or misunderstood.

**How to avoid:**
```typescript
// CORRECT: Verify signature first
async handleStripeWebhook(req: Request) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw body, not parsed JSON
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    throw new Error('Invalid signature');
  }

  if (event.type === 'payment_intent.succeeded') {
    await this.markOrderAsPaid(event.data.object.metadata.orderId);
  }
}

// WRONG: No verification
async handleStripeWebhook(req: Request) {
  const event = req.body; // parsed JSON, anyone can send this
  if (event.type === 'payment_intent.succeeded') {
    await this.markOrderAsPaid(event.data.object.metadata.orderId);
  }
}
```

**Warning signs:**
- Webhook handler doesn't import Stripe SDK
- No STRIPE_WEBHOOK_SECRET in environment variables
- Webhook endpoint parses JSON body (should use raw body)
- No error handling for signature verification failures
- Webhook works with curl POST requests (should fail without signature)

**Phase to address:**
Phase: Payment Integration (must be implemented before production, cannot ship without this)

**Sources:**
- [Stripe Payment Integration: Complete Dev Guide 2026](https://www.digitalapplied.com/blog/stripe-payment-integration-developer-guide-2026)
- [Integration security guide | Stripe Documentation](https://docs.stripe.com/security/guide)
- [Stop Fearing Payments: The Ultimate 2026 Guide](https://medium.com/@hasalaonline/stop-fearing-payments-the-ultimate-2026-guide-to-integrating-stripe-its-easier-than-you-think-2fe1b029d454)

---

### Pitfall 5: Category Tree N+1 Query Explosion

**What goes wrong:**
Loading category navigation triggers hundreds of database queries. Each category loads its children in separate queries. A 4-level category tree with 10 children each = 1,111 queries for a single page load. Page takes 5+ seconds to render. Users abandon site.

**Why it happens:**
Recursive category loading without eager loading. Each level triggers new database round-trip. Prisma/ORM makes this easy to write incorrectly. Developers test with shallow trees (2 levels, fast) but production has deep nested categories.

**How to avoid:**
```typescript
// CORRECT: Recursive CTE for entire tree in one query
const categories = await prisma.$queryRaw`
  WITH RECURSIVE category_tree AS (
    SELECT id, name, "parentId", 1 as depth
    FROM "Category"
    WHERE "parentId" IS NULL

    UNION ALL

    SELECT c.id, c.name, c."parentId", ct.depth + 1
    FROM "Category" c
    JOIN category_tree ct ON c."parentId" = ct.id
    WHERE ct.depth < 5
  )
  SELECT * FROM category_tree ORDER BY depth, name;
`;

// Then build tree structure in memory

// WRONG: N+1 queries
async function loadCategoryTree(parentId = null) {
  const categories = await prisma.category.findMany({
    where: { parentId }
  });

  for (const cat of categories) {
    cat.children = await loadCategoryTree(cat.id); // N+1!
  }

  return categories;
}
```

**Warning signs:**
- Database query count in hundreds for single page load
- Slow category navigation rendering
- Database connection pool exhaustion during traffic spikes
- Prisma query logs showing repeated similar queries with different IDs
- Performance degrades as category count grows

**Phase to address:**
Phase: Category Tree Implementation (must use correct query pattern from start, hard to refactor later)

**Sources:**
- [The Definitive Guide to Ecommerce Category Trees](https://webshopmanager.com/how-to-build-ecommerce-category-tree/)
- [ConCaT: Construction of Category Trees](https://slavanov.com/research/icde21b.pdf)

---

### Pitfall 6: Dual Database Consistency Without Saga Pattern

**What goes wrong:**
Order creation writes to PostgreSQL (inventory deduction) and MongoDB (order document). PostgreSQL transaction succeeds but MongoDB write fails (network issue, timeout). Inventory decremented but no order exists. Stock is "lost" until manual reconciliation. Opposite scenario: order created in MongoDB but PostgreSQL inventory update fails, allowing overselling.

**Why it happens:**
Treating two databases as if they're one transactional system. No compensation logic for partial failures. Assumption that both writes will succeed or fail together. Distributed transaction complexity underestimated.

**How to avoid:**
```typescript
// CORRECT: Saga pattern with compensation
async createOrder(orderData) {
  let inventoryReserved = false;
  let orderId = null;

  try {
    // Step 1: Reserve inventory in PostgreSQL
    await prisma.productVariant.update({
      where: { id: orderData.variantId, stock: { gte: orderData.quantity } },
      data: { stock: { decrement: orderData.quantity } }
    });
    inventoryReserved = true;

    // Step 2: Create order in MongoDB
    const order = await Order.create(orderData);
    orderId = order._id;

    // Step 3: Mark inventory reservation as committed
    await prisma.inventoryReservation.create({
      data: { orderId: orderId.toString(), committed: true }
    });

    return order;
  } catch (error) {
    // Compensate: rollback inventory if order creation failed
    if (inventoryReserved && !orderId) {
      await prisma.productVariant.update({
        where: { id: orderData.variantId },
        data: { stock: { increment: orderData.quantity } }
      });
    }
    throw error;
  }
}

// WRONG: No compensation for partial failure
async createOrder(orderData) {
  await prisma.productVariant.update({ /* decrement stock */ });
  await Order.create(orderData); // if this fails, stock is lost
}
```

Also implement:
- Event-driven reconciliation: publish "OrderCreated" event, inventory service subscribes
- Idempotency keys on both databases to handle retries safely
- Background job to detect and fix inconsistencies
- Consider moving to single database if dual-database complexity isn't justified

**Warning signs:**
- Manual stock adjustments needed frequently
- "Phantom" inventory decrements with no corresponding orders
- Orders in MongoDB with no inventory record in PostgreSQL
- No idempotency handling in order creation
- No compensation logic in error handlers
- No reconciliation jobs in codebase

**Phase to address:**
Phase: Order & Inventory Integration (architectural decision, must implement saga pattern from start)

**Sources:**
- [MongoDB vs PostgreSQL: Choosing the Right Database](https://www.knowi.com/blog/mongodb-vs-postgresql-choosing-the-right-database-for-your-needs/)
- [Understanding Data Consistency and Transactions](https://dev-aditya.medium.com/understanding-data-consistency-and-transactions-postgresql-vs-mongodb-c0ef6d675b93)

---

### Pitfall 7: Admin Panel Without Role-Based Access Control

**What goes wrong:**
Admin panel implemented with single "isAdmin" boolean check. Any admin user can delete products, modify prices, access customer payment info, and export all data. Disgruntled or compromised admin account causes data breach or malicious changes. No audit trail of who changed what.

**Why it happens:**
RBAC complexity seems overkill for small team. "We'll add it later" becomes never. Copy-paste of basic auth middleware without permission granularity. Lack of understanding that admin roles need hierarchy (super admin, product manager, customer support, analyst).

**How to avoid:**
```typescript
// CORRECT: Role-based permissions
enum Permission {
  PRODUCT_READ = 'product:read',
  PRODUCT_WRITE = 'product:write',
  ORDER_READ = 'order:read',
  ORDER_REFUND = 'order:refund',
  USER_READ = 'user:read',
  USER_DELETE = 'user:delete',
  ANALYTICS_VIEW = 'analytics:view',
}

const rolePermissions = {
  SUPER_ADMIN: Object.values(Permission),
  PRODUCT_MANAGER: [Permission.PRODUCT_READ, Permission.PRODUCT_WRITE],
  SUPPORT: [Permission.ORDER_READ, Permission.ORDER_REFUND, Permission.USER_READ],
  ANALYST: [Permission.ANALYTICS_VIEW, Permission.ORDER_READ],
};

function requirePermission(permission: Permission) {
  return (req, res, next) => {
    const userRole = req.user.role;
    const permissions = rolePermissions[userRole] || [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Use in routes
router.delete('/products/:id',
  requireAuth,
  requirePermission(Permission.PRODUCT_WRITE),
  productController.delete
);

// WRONG: Binary admin check
function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}
```

Also implement:
- Audit logging for all admin actions (who, what, when, IP address)
- Separate database table for admin action logs (immutable)
- UI indicators showing user's permission level
- Two-factor authentication requirement for admin users

**Warning signs:**
- Single "requireAdmin" middleware used everywhere
- No role field in User schema beyond boolean isAdmin
- No audit logs in database
- All admin users have identical capabilities
- Cannot trace who made a specific product change

**Phase to address:**
Phase: Admin Panel Implementation (must design RBAC system before building admin features)

**Sources:**
- [Most Common and Uncommon Vulnerabilities in E-Commerce](https://medium.com/@just_x147/most-common-and-uncommon-vulnerabilities-i-have-uncovered-in-some-e-commerce-websites-3360e658005d)
- [eCommerce Security Best Practices](https://nordlayer.com/blog/ecommerce-security-best-practices/)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Client-submitted prices in order creation | Saves one DB query per order | Revenue loss from price manipulation, cannot audit pricing accuracy | Never acceptable |
| Manual inventory adjustments without audit trail | Quick fix for stock issues | Cannot debug inventory leaks, accounting nightmares, potential fraud | Never in production |
| Storing product images as URL strings | Simple schema, easy uploads | No CDN optimization, broken links, no image processing, poor performance | Only in MVP, must migrate before scale |
| Single "isAdmin" role | Fast initial implementation | Security breach risk, cannot delegate tasks safely | Only during initial prototyping, never in production |
| Skipping webhook signature verification | Webhooks work in testing | Anyone can fake payment confirmations | Never acceptable, even in development |
| Using database enums instead of lookup tables | Simpler schema, type safety | Cannot add new values without migration, no internationalization | Acceptable for truly static values (order status) |
| In-memory event bus | No external dependencies | Events lost on restart, cannot scale horizontally | Acceptable for MVP, must migrate before production |
| Hardcoded shipping rates | Fast checkout implementation | Cannot adjust for zone/weight, legal compliance issues | Acceptable for single-country MVP only |
| Product images without alt text | Faster content entry | SEO penalty, accessibility violation, cannot be indexed | Never acceptable |
| No product image optimization | Faster development | Poor page speed, SEO penalty, high CDN costs | Only during initial development, must optimize before launch |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Stripe Payments | Using publishable key on server, or secret key in client | Server: use secret key (sk_), Client: use publishable key (pk_) |
| Stripe Webhooks | Parsing webhook as JSON immediately | Use raw body buffer for signature verification, then parse |
| Clerk Auth | Storing user profile data in Clerk only | Sync user data to local database via webhooks, use Clerk for auth only |
| Clerk Middleware | Protecting all routes including public product pages | Use publicRoutes config to exclude product listings, only protect checkout/account |
| Cloudinary | Uploading original 5MB images | Resize and compress before upload, use Cloudinary transformations for variants |
| Algolia/Meilisearch | Syncing entire product catalog on every change | Use incremental updates, queue batch sync for off-peak hours |
| Resend Emails | Sending order confirmation immediately after order creation | Send via event/queue to handle failures, retry on temporary issues |
| Prisma Migrations | Running migrations in production without backup | Always backup before migration, test migrations on staging first |
| MongoDB Connection | Creating new connection for each request | Use singleton pattern, connection pooling, reuse connections |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all products without pagination | Fast with 50 products | Server-side cursor pagination with limit enforcement (max 100) | >1,000 products |
| Eager loading all product relations (variants, images, categories) | Works in development | Selective field loading based on endpoint needs | >10,000 products |
| Real-time inventory checks on every product card | Accurate stock display | Cache inventory counts, update on stock change events | >100 concurrent users |
| Synchronous image uploads during product creation | Simple implementation | Background job for image processing, return optimistic response | >1GB total images |
| Category tree loaded on every request | Correct data always | Cache category tree in Redis, invalidate on category changes | >500 categories |
| Full-text search via SQL LIKE queries | No external dependencies | Dedicated search service (Algolia, Meilisearch, Elasticsearch) | >10,000 products |
| Calculating order analytics in real-time | Live data | Pre-aggregate metrics in background jobs, cache dashboard data | >1,000 orders/day |
| Serving product images from app server | No CDN costs | CDN with image optimization (Cloudinary, imgix, Vercel Image) | >10,000 monthly visitors |
| Order status updates via polling | Simple client code | WebSocket or Server-Sent Events for real-time updates | >50 active checkouts |
| No database indexes on foreign keys | Fast writes | Index all foreign keys, commonly filtered fields (status, category) | >100,000 records |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Accepting order total from client | Revenue loss via price manipulation | Always calculate total server-side from current product prices |
| No rate limiting on checkout endpoint | Inventory exhaustion attacks, DDoS | Rate limit by IP and by user, stricter limits on order creation |
| Admin panel on same domain as storefront | Session hijacking, CSRF attacks | Separate subdomain (admin.example.com) with stricter CSP |
| Storing credit card data | PCI-DSS violation, massive liability | Use Stripe payment methods, never store card numbers |
| Email addresses as primary user identifier without verification | Account takeover, spam | Require email verification, support changing email with re-verification |
| No CAPTCHA on registration/checkout | Bot attacks, fake orders | Implement CAPTCHA on high-value actions (register, checkout, review submission) |
| Exposing internal product IDs in URLs | Enumeration attacks, data scraping | Use slugs or UUIDs for public URLs, keep sequential IDs internal |
| Admin API keys in client-side JavaScript | Full database access for attackers | Never expose API keys in client, use session-based auth |
| No input sanitization on product search | XSS via search queries | Sanitize all user input, escape output, use CSP headers |
| Weak password requirements | Account takeover | Minimum 12 characters, check against compromised password database |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Hiding out-of-stock variants completely | Users don't know product exists in other colors | Show all variants, mark out-of-stock, allow "notify when available" |
| Using same image for all product variants | Cannot see actual color/style | Require unique images per variant, swap image on variant selection |
| Cart not persisted for guest users | Lost cart on page refresh | Store guest carts in localStorage + backend session |
| No order confirmation email | Users panic, contact support | Send immediate confirmation, include order details and tracking setup timeline |
| Checkout requires account creation | 70% cart abandonment rate | Offer guest checkout, allow account creation after order |
| Hidden shipping costs until final checkout step | 55% cart abandonment cause | Show estimated shipping early, allow entering ZIP for calculation |
| No size guide on variable products | High return rates | Embedded size charts, measurement guides, fit finder |
| Infinite scroll on product listings without URL state | Cannot share/bookmark specific page | Pagination with URL params, or infinite scroll with URL fragment updates |
| No filter state in URL | Cannot share filtered results, back button breaks | Serialize filters to URL query params |
| Product reviews without verification | Fake reviews, trust issues | Badge verified purchases, require order ID for reviews |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Stripe Integration:** Often missing webhook signature verification — verify constructEvent call exists with webhookSecret
- [ ] **Product Variants:** Often missing unique images per variant — verify each variant has its own image array, not shared
- [ ] **Inventory Management:** Often missing atomic stock deduction — verify Prisma transaction with conditional update
- [ ] **Cart System:** Often missing guest cart persistence — verify localStorage sync + backend session storage
- [ ] **Order Creation:** Often missing server-side price calculation — verify prices fetched from database, not client
- [ ] **Category Tree:** Often missing recursive query optimization — verify single query (CTE) or caching, not N+1
- [ ] **Search System:** Often missing faceted filters — verify filter state management, URL params, backend filter query
- [ ] **Admin Panel:** Often missing audit logs — verify admin_actions table with user, action, timestamp, payload
- [ ] **Image Uploads:** Often missing optimization — verify CDN integration, WebP conversion, responsive srcset
- [ ] **Authentication:** Often missing token refresh — verify Clerk session management, token expiration handling
- [ ] **Email Notifications:** Often missing failure retry — verify queue/event system, not synchronous sending
- [ ] **Error Handling:** Often missing client-friendly messages — verify error middleware maps technical errors to user messages
- [ ] **Shipping Calculation:** Often missing zone/weight logic — verify not hardcoded, uses shipping service or rules engine
- [ ] **Multi-currency:** Often missing consistent rounding — verify all prices use same decimal precision (e.g., Stripe's cents)
- [ ] **Returns/Refunds:** Often missing inventory restoration — verify stock incremented when refund processed

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Orphaned product variants | MEDIUM | Write script to detect variants with inconsistent attributes, normalize to canonical form, merge duplicates, add validation to prevent recurrence |
| Inventory race conditions (oversold) | HIGH | Identify affected orders, offer expedited delivery from different warehouse, or offer refund + discount code, implement atomic updates |
| Price manipulation orders | HIGH | Detect via analytics (orders with suspiciously low totals), cancel fraudulent orders, refund/block user, implement server-side calculation |
| Webhook security bypass | CRITICAL | Audit all orders marked paid in last 30 days, verify Stripe payment_intent exists, refund fraudulent orders, implement signature verification |
| Category tree N+1 queries | LOW | Add Redis cache layer with TTL, implement recursive CTE query, monitor with query performance logs |
| Dual database inconsistency | HIGH | Write reconciliation script comparing PostgreSQL inventory vs MongoDB orders, manual adjustments, implement saga pattern going forward |
| Missing RBAC | MEDIUM | Audit recent admin actions, implement permission system, require all admins to re-authenticate with new roles, add logging |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Product variant orphaning | Phase: Database Schema Design | Database constraints prevent duplicate attributes, TypeScript enums enforce valid values |
| Inventory race conditions | Phase: Cart & Checkout | Load test with concurrent order creation, verify no negative stock possible |
| Price manipulation | Phase: Order Creation API | Manual test with modified request, verify server recalculates total |
| Webhook signature bypass | Phase: Payment Integration | Test webhook with invalid signature, verify rejection |
| Category tree N+1 | Phase: Category System | Query log analysis, verify single query for entire tree |
| Dual database consistency | Phase: Order Management Architecture | Simulate MongoDB write failure, verify inventory rollback |
| Missing RBAC | Phase: Admin Panel Foundation | Test with support role user, verify cannot delete products |
| Image not optimized | Phase: Product Image Upload | Verify WebP generation, CDN URLs, responsive srcset in HTML |
| No guest cart persistence | Phase: Cart Implementation | Clear localStorage, verify cart restored from backend session |
| Search without filters | Phase: Search Integration | Verify filter state in URL, back button works, filters query backend correctly |

---

## Tech Stack Specific Warnings

### Next.js 16 / React 19 Pitfalls

**Server Component Data Fetching:**
- Placing 'use client' boundary too high in tree forces unnecessary client-side hydration
- Using async/await directly in client components causes "Dynamic Server Usage" errors
- Fetching slow data in layouts blocks streaming for entire page
- **Fix:** Push 'use client' deep into tree, use Suspense boundaries, fetch slow data in parallel

**Serialization Issues:**
- Passing Date objects, functions, or class instances from Server to Client Components causes hydration mismatches
- **Fix:** Convert to plain objects/strings before crossing boundary, use .toISOString() for dates

**Context API in App Router:**
- Trying to use React Context in Server Components (unsupported)
- Placing Context Provider in wrong location (must be Client Component)
- **Fix:** Wrap context provider with 'use client', place in layout as Client Component

**Sources:**
- [6 React Server Component performance pitfalls](https://blog.logrocket.com/react-server-components-performance-mistakes)
- [7 Costly Mistakes with React Server Components](https://javascript.plainenglish.io/7-costly-mistakes-to-avoid-with-react-server-components-in-next-js-c5703a83d1a7)
- [Common mistakes with Next.js App Router](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)

### Express 5 / Async Middleware Pitfalls

**Automatic Promise Rejection Handling:**
- Express 5 automatically calls next(error) for rejected promises in async handlers
- **Benefit:** No need for try/catch in every async route
- **Warning:** Still need centralized error-handling middleware with 4 parameters: (err, req, res, next)

**Middleware Ordering:**
- Error-handling middleware must be registered AFTER all routes
- Body parsing middleware (express.json()) must come BEFORE routes that need it
- **Fix:** Standard order: CORS → body parsers → routes → error handlers

**Webhook Raw Body Requirement:**
- Stripe signature verification requires raw body buffer, not parsed JSON
- **Fix:** Use express.raw({ type: 'application/json' }) for webhook route only

**Sources:**
- [Express 5 Brings Built-in Promise Support](https://dev.to/siddharth_g/express-5-brings-built-in-promise-support-for-error-handling-5bjf)
- [Express Error Handling Patterns](https://betterstack.com/community/guides/scaling-nodejs/error-handling-express/)
- [How to Handle Error Handling Properly in Express](https://oneuptime.com/blog/post/2026-02-02-express-error-handling/view)

### Prisma Transaction Pitfalls

**Transaction Timeout:**
- Interactive transactions default to 5000ms timeout
- Complex multi-step operations may exceed this
- **Fix:** Increase timeout with maxWait option, or reduce transaction scope

**Isolation Level:**
- Default isolation may allow race conditions under high concurrency
- **Fix:** Use Prisma.TransactionIsolationLevel.Serializable for critical operations (inventory, payments)

**Nested Writes vs Explicit Transactions:**
- Nested writes (create with relations) are automatically transactional
- Mixed updates require explicit $transaction
- **Fix:** Prefer nested writes when possible, use explicit transaction for complex flows

**Sources:**
- [Transactions and batch queries | Prisma Documentation](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- [Mastering Database Rollbacks with Prisma](https://medium.com/@moiserushanika2006/mastering-database-rollbacks-with-prismas-transactional-finesse-9156b8319bb1)

---

## Domain Research Gaps

Areas requiring phase-specific research during implementation:

**Advanced Search Ranking:**
- How to balance relevance vs. availability (in-stock prioritization)
- Session-aware filter recommendations based on user behavior
- **When to research:** Phase: Search & Filter Implementation

**Multi-Warehouse Inventory:**
- Inventory allocation strategies (closest warehouse, split shipments)
- Real-time inventory sync across distributed warehouses
- **When to research:** Phase: Advanced Inventory Management (if multi-warehouse is in scope)

**Dynamic Pricing:**
- Real-time competitor price monitoring
- Automated price adjustments within margins
- **When to research:** Only if dynamic pricing becomes a requirement (not in current scope)

**Internationalization:**
- Multi-currency rounding consistency (Stripe uses cents, display uses decimals)
- Tax calculation per region (may require service like Avalara)
- **When to research:** Phase: Multi-Region Support

**Advanced Analytics:**
- Customer lifetime value calculation
- Cohort analysis for retention
- **When to research:** Phase: Analytics Dashboard Enhancement

---

*Pitfalls research for: Universal E-Commerce Template*
*Researched: 2026-03-10*
*Confidence: HIGH (verified with official documentation, community experience, and 2026 sources)*
