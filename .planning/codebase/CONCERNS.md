# Codebase Concerns

**Analysis Date:** 2026-03-10

## Tech Debt

**Dual Database Architecture:**
- Issue: Using both Prisma (PostgreSQL) and Mongoose (MongoDB) without clear separation of concerns
- Files: `packages/db/src/prisma.ts`, `packages/db/src/mongoose.ts`, `packages/db/src/index.ts`
- Impact: Orders are stored in MongoDB while Products/Users are in PostgreSQL, creating data consistency challenges and complex transaction handling. No atomic operations across databases.
- Fix approach: Standardize on single database or implement proper event sourcing/saga pattern for distributed transactions. Add data integrity checks and reconciliation jobs.

**Mock Payment Integration:**
- Issue: Payment service returns mock data instead of real Stripe integration
- Files: `apps/server/src/modules/payment/payment.service.ts` (lines 6-22)
- Impact: Cannot process real payments. Mock payment intents bypass actual payment validation, security checks, and webhook verification.
- Fix approach: Implement actual Stripe SDK integration using config values from `apps/server/src/config/index.ts`. Add proper webhook signature verification and idempotency keys.

**Placeholder Authentication:**
- Issue: Auth middleware only checks for Bearer token presence, doesn't verify tokens with Clerk
- Files: `apps/server/src/common/middleware/auth.middleware.ts` (lines 13-17, 21-22)
- Impact: Any request with "Bearer xyz" header bypasses authentication. No actual user verification, session validation, or role-based access control enforcement. Critical security vulnerability.
- Fix approach: Integrate `@clerk/clerk-sdk-node` to verify JWT tokens. Extract user ID and role from verified token. Implement proper admin role checking.

**Missing Clerk SDK Integration:**
- Issue: Auth service syncs users but has no Clerk SDK dependency
- Files: `apps/server/src/modules/auth/auth.service.ts`, `apps/server/package.json`
- Impact: No way to receive Clerk webhook events for user creation/updates. Manual sync endpoint exists but requires external orchestration. User data can become stale.
- Fix approach: Add `@clerk/clerk-sdk-node` dependency, implement webhook handler for `user.created` and `user.updated` events, add signature verification.

**No Input Validation:**
- Issue: Controllers accept request data without validation schemas
- Files: All controller files in `apps/server/src/modules/*/` directories
- Impact: Invalid data can reach services and database, causing runtime errors, data corruption, or injection attacks. Zod is installed but unused.
- Fix approach: Create Zod schemas for all request bodies, use existing validate middleware from `apps/server/src/common/middleware/validate.ts` on routes.

**Type Mismatch Between Prisma Schema and Types Package:**
- Issue: User role enum is uppercase in Prisma schema but lowercase in types package
- Files: `packages/db/prisma/schema.prisma` (line 16: `Role @default(CUSTOMER)`), `packages/types/src/index.ts` (line 36: `role: 'customer' | 'admin'`)
- Impact: Runtime type errors when comparing roles. Role checks may fail silently.
- Fix approach: Standardize on single case convention (lowercase recommended for JSON APIs). Update either Prisma schema enum or TypeScript types to match.

**No Stock Management:**
- Issue: ProductVariant has stock field but no inventory deduction on order creation
- Files: `packages/db/prisma/schema.prisma` (line 63), `apps/server/src/modules/order/order.service.ts` (create method)
- Impact: Can oversell products. No prevention of ordering out-of-stock items. Race conditions possible with concurrent orders.
- Fix approach: Add stock validation before order creation. Implement atomic stock decrement transaction. Add stock reservation during checkout flow.

**No Frontend Authentication:**
- Issue: Client and admin apps have no Clerk integration despite backend expecting it
- Files: `apps/client/src/lib/api.ts`, `apps/admin/src/lib/api.ts`, `apps/client/package.json`, `apps/admin/package.json`
- Impact: API calls fail without authentication headers. No login/logout functionality. No way for users to authenticate.
- Fix approach: Add `@clerk/nextjs` dependency to both apps, wrap apps with ClerkProvider, add authentication components, pass auth token in API fetcher.

## Known Bugs

**Missing Environment Variable Validation:**
- Symptoms: Server crashes with cryptic errors if environment variables are missing
- Files: `apps/server/src/config/index.ts` (lines 6-10)
- Trigger: Start server without `.env` file or with incomplete environment variables
- Workaround: Config accesses with `!` assertion operator assumes values exist. Add `.env` file from `.env.example`.

**Event Bus Listeners Never Cleaned Up:**
- Symptoms: Event listeners registered in server index but never removed
- Files: `apps/server/src/index.ts` (lines 33-39)
- Trigger: Hot reload in development causes listener accumulation
- Workaround: Restart server periodically. Memory leak in long-running development sessions.

**No Price Consistency Validation:**
- Symptoms: Order items store price snapshot, but no validation against current product price
- Files: `apps/server/src/modules/order/order.service.ts` (create method)
- Trigger: Frontend sends manipulated prices in order creation request
- Workaround: None - price from request is trusted without verification.

## Security Considerations

**Unprotected Admin Routes:**
- Risk: Admin endpoints accessible with any bearer token
- Files: `apps/server/src/modules/product/product.routes.ts`, `apps/server/src/modules/order/order.routes.ts`
- Current mitigation: requireAdmin middleware exists but doesn't verify admin role
- Recommendations: Implement proper role verification in `apps/server/src/common/middleware/auth.middleware.ts` after Clerk integration. Use Role enum from Prisma schema.

**CORS Configuration Too Permissive:**
- Risk: Accepts requests from any origin matching config URLs
- Files: `apps/server/src/index.ts` (line 15)
- Current mitigation: Limited to CLIENT_URL and ADMIN_URL from environment
- Recommendations: Add credentials: true for cookie handling. Implement origin validation function. Add CORS error handling.

**No Rate Limiting:**
- Risk: API vulnerable to brute force, DDoS, and resource exhaustion
- Files: All route files lack rate limiting middleware
- Current mitigation: None
- Recommendations: Add express-rate-limit middleware to authentication and payment endpoints. Implement per-user rate limits for authenticated routes.

**Database Credentials in Docker Compose:**
- Risk: Default passwords in version control
- Files: `docker-compose.yml` (lines 7-8, 20-21)
- Current mitigation: File not ignored, contains weak default credentials
- Recommendations: Use environment variable substitution. Document secure password generation. Add docker-compose.override.yml pattern for local customization (add to .gitignore).

**No SQL Injection Protection for MongoDB:**
- Risk: Direct object insertion without sanitization
- Files: `apps/server/src/modules/order/order.service.ts` (create and updateStatus methods)
- Current mitigation: TypeScript interfaces provide some type safety
- Recommendations: Add input sanitization for MongoDB queries. Validate ObjectId format. Use Zod schemas to strip unexpected fields.

**No CSRF Protection:**
- Risk: State-changing operations vulnerable to cross-site request forgery
- Files: All POST/PUT/DELETE routes lack CSRF tokens
- Current mitigation: None (JWT in header provides some protection if properly implemented)
- Recommendations: Consider CSRF tokens for cookie-based sessions if added later. Document that JWT-only auth is intentional. Add SameSite cookie flags when cookies are used.

**Payment Webhook Without Signature Verification:**
- Risk: Anyone can trigger payment webhook and mark orders as paid
- Files: `apps/server/src/modules/payment/payment.service.ts` (handleWebhook method)
- Current mitigation: None - webhook accepts any payload
- Recommendations: Implement Stripe webhook signature verification using STRIPE_WEBHOOK_SECRET. Reject unsigned requests. Log verification failures.

## Performance Bottlenecks

**No Database Connection Pooling Configuration:**
- Problem: Default Prisma connection pool may be inadequate for production load
- Files: `packages/db/src/prisma.ts` (no pool configuration)
- Cause: PrismaClient instantiated without connection pool settings
- Improvement path: Add connection_limit and pool_timeout to DATABASE_URL. Configure based on expected concurrent requests. Monitor connection usage.

**No Query Optimization:**
- Problem: Product queries always include all relations regardless of need
- Files: `apps/server/src/modules/product/product.service.ts` (lines 9-15, includes category and variants on all fetches)
- Cause: Eager loading without considering response size
- Improvement path: Add selective field loading. Use Prisma select for specific endpoints. Implement GraphQL or field selection query params.

**Missing Pagination Validation:**
- Problem: Page/limit parameters unbounded, allowing excessive data fetches
- Files: All service methods with pagination (default limit=20 but no max enforcement)
- Cause: No validation on limit parameter size
- Improvement path: Cap maximum limit (e.g., 100 items). Validate page is positive integer. Add default limits in middleware.

**No Caching Layer:**
- Problem: Every product list request hits database
- Files: `apps/server/src/modules/product/product.service.ts` (getAll method)
- Cause: No Redis or in-memory cache
- Improvement path: Add Redis for frequently accessed data (product lists, categories). Implement cache invalidation on product updates. Use stale-while-revalidate pattern.

**Synchronous MongoDB Connection:**
- Problem: Server startup blocks on MongoDB connection
- Files: `apps/server/src/index.ts` (line 43)
- Cause: await connectMongoDB before server starts
- Improvement path: Make MongoDB connection non-blocking. Allow server to start and retry connection. Add health check that reflects database status.

## Fragile Areas

**Event-Driven Order Flow:**
- Files: `apps/server/src/common/events/event-bus.ts`, `apps/server/src/index.ts` (event listeners)
- Why fragile: Event bus is in-memory only, events lost if process restarts. Payment completion event has no retry mechanism. Order status may not update if listener fails.
- Safe modification: Add persistent event queue (Redis Streams, Bull). Implement idempotent event handlers. Add dead letter queue for failed events.
- Test coverage: No tests - event handling is untested

**Order Total Calculation:**
- Files: `apps/server/src/modules/order/order.service.ts` (create method line 42)
- Why fragile: Total amount accepted from client without server-side validation. No recalculation based on current product prices or verification of cart item prices.
- Safe modification: Always recalculate total on server. Fetch current prices from product variants. Add price validation middleware. Return calculated total to client for confirmation.
- Test coverage: No tests for price calculation logic

**Database Client Singletons:**
- Files: `packages/db/src/prisma.ts`, `packages/db/src/mongoose.ts`
- Why fragile: Global singletons without proper cleanup. Hot reload in development can cause connection leaks. No graceful shutdown handling.
- Safe modification: Implement connection lifecycle management. Add beforeExit handlers to close connections. Use dependency injection instead of global state.
- Test coverage: No tests - database initialization untested

**Type-Only Package:**
- Files: `packages/types/src/index.ts`
- Why fragile: All types are interfaces only, no runtime validation. Changes to types don't propagate to runtime behavior. Prisma-generated types diverge from manual types.
- Safe modification: Generate types from Prisma schema. Use Zod schemas that produce both types and runtime validators. Keep single source of truth.
- Test coverage: No runtime type validation

## Scaling Limits

**Single Server Architecture:**
- Current capacity: Single Node.js process
- Limit: CPU-bound operations block all requests. No horizontal scaling possible with in-memory event bus.
- Scaling path: Implement message queue (RabbitMQ, SQS) for events. Add load balancer. Use connection pooling with read replicas. Separate worker processes for background jobs.

**No Image Storage Strategy:**
- Current capacity: Product images stored as string arrays (URLs)
- Limit: No actual image upload implementation. Assumes external CDN but no upload endpoint.
- Scaling path: Implement S3-compatible storage. Add image processing pipeline (resizing, optimization). Use CloudFront or imgix for CDN. Add image validation and virus scanning.

**MongoDB Without Sharding:**
- Current capacity: Single MongoDB instance for orders
- Limit: Orders collection will grow unbounded. No partitioning strategy for large order volumes.
- Scaling path: Implement collection partitioning by date. Archive old orders. Consider sharding by user ID or order date. Add read replicas.

## Dependencies at Risk

**Express 5 (Beta):**
- Risk: Using Express 5.1.0 which may have breaking changes before stable release
- Impact: Middleware compatibility issues, potential for bugs in production
- Migration plan: Monitor Express 5 release notes. Test middleware compatibility. Consider sticking to Express 4.x LTS until 5.x is stable. Update TypeScript types when moving to stable.

**Next.js 16 (Preview):**
- Risk: Using Next.js 16.1.5 for client and admin apps
- Impact: Breaking changes in App Router patterns, React 19 compatibility issues, potential for SSR hydration bugs
- Migration plan: Follow Next.js upgrade guide when stable version releases. Test server components thoroughly. Review middleware behavior changes.

**React 19:**
- Risk: Using React 19.2.0 (recently released, less battle-tested)
- Impact: New hooks behavior, concurrent rendering changes, potential for third-party library incompatibilities
- Migration plan: Monitor React 19 ecosystem adoption. Test Zustand compatibility in client app. Review breaking changes for useEffect cleanup.

**Deprecated npm Packages:**
- Risk: pnpm-lock.yaml shows deprecated packages (glob, deep-strict-equal, safe-compare)
- Impact: Security vulnerabilities may not be patched. Dependencies may be removed from npm registry.
- Migration plan: Run pnpm audit. Update to recommended replacements. Audit dependency tree for deprecated transitive dependencies.

## Missing Critical Features

**No Order Fulfillment Workflow:**
- Problem: Orders can be created but no fulfillment process (shipping integration, tracking, notifications)
- Blocks: Cannot ship products, no customer notifications, no tracking updates
- Priority: High

**No Email Service:**
- Problem: No transactional emails for order confirmation, shipping, password reset
- Blocks: Poor customer experience, no order receipts, no password recovery
- Priority: High

**No Search Functionality:**
- Problem: No product search by name, description, or category
- Blocks: Poor discoverability, requires pagination through all products
- Priority: Medium

**No Error Monitoring:**
- Problem: Errors logged to console only, no aggregation or alerting
- Blocks: Cannot detect production issues proactively, no error tracking across requests
- Priority: High

**No Logging Infrastructure:**
- Problem: console.log/console.error only, no structured logging
- Blocks: Cannot debug production issues, no log aggregation or search
- Priority: Medium

## Test Coverage Gaps

**Zero Test Files:**
- What's not tested: All application code
- Files: Entire `apps/` and `packages/` directories have no test files
- Risk: Changes break functionality without detection. Refactoring is dangerous. No regression prevention.
- Priority: Critical

**No API Integration Tests:**
- What's not tested: Route handlers, middleware chains, database interactions
- Files: All route files in `apps/server/src/modules/*/`
- Risk: Breaking changes to API contracts. Middleware ordering bugs. Database constraint violations.
- Priority: High

**No Frontend Testing:**
- What's not tested: React components, state management, API integration
- Files: `apps/client/src/`, `apps/admin/src/`
- Risk: UI regressions. State management bugs. API contract mismatches.
- Priority: Medium

**No End-to-End Tests:**
- What's not tested: Complete user flows (checkout, order placement, payment)
- Risk: Integration points between services untested. Critical paths can break silently.
- Priority: High

---

*Concerns audit: 2026-03-10*
