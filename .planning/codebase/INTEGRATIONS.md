# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**Authentication:**
- Clerk - User authentication and identity management
  - SDK/Client: Not yet integrated (placeholder code in `apps/server/src/common/middleware/auth.middleware.ts`)
  - Auth: `CLERK_SECRET_KEY` (server), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (client)
  - Status: Configuration ready, SDK integration pending
  - Implementation files:
    - `apps/server/src/common/middleware/auth.middleware.ts` - Auth middleware with TODO comments
    - `apps/server/src/modules/auth/auth.service.ts` - User sync service (syncs Clerk users to local DB)

**Payment Processing:**
- Stripe - Payment intent creation and webhook handling
  - SDK/Client: Not yet integrated (placeholder code in `apps/server/src/modules/payment/payment.service.ts`)
  - Auth: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Status: Configuration ready, SDK integration pending
  - Implementation files:
    - `apps/server/src/modules/payment/payment.service.ts` - Mock payment service with Stripe integration TODOs
    - `apps/server/src/modules/payment/payment.controller.ts` - Payment intent and webhook endpoints

## Data Storage

**Databases:**
- PostgreSQL 16
  - Connection: `DATABASE_URL` (format: `postgresql://postgres:postgres@localhost:5432/ecom?schema=public`)
  - Client: Prisma ORM 6.8.0 (`@prisma/client`)
  - Schema: `packages/db/prisma/schema.prisma`
  - Models: User, Category, Product, ProductVariant
  - Usage: Relational data (users, products, categories, variants)
  - Singleton instance: `packages/db/src/prisma.ts`

- MongoDB 7
  - Connection: `MONGODB_URI` (format: `mongodb://root:root@localhost:27017/ecom_orders?authSource=admin`)
  - Client: Mongoose 8.14.0
  - Schema: `packages/db/src/mongoose.ts`
  - Models: Order (with items, status, shipping address, payment intent)
  - Usage: Document-based order data with embedded items and addresses
  - Connection function: `connectMongoDB()` in `packages/db/src/mongoose.ts`

**File Storage:**
- Local filesystem only - Product images stored as string arrays in PostgreSQL
  - No external file storage service configured (S3, Cloudinary, etc.)

**Caching:**
- None - No Redis or caching layer configured

## Authentication & Identity

**Auth Provider:**
- Clerk
  - Implementation: Server-side token verification (pending integration)
  - User sync: Clerk users synced to local PostgreSQL database via webhook or manual sync
  - Local user model: `User` table in Prisma with `clerkId` field as unique identifier
  - Endpoints:
    - `apps/server/src/modules/auth/auth.controller.ts` - User sync and retrieval
    - `apps/server/src/modules/auth/auth.routes.ts` - Auth API routes
  - Middleware: `requireAuth()` and `requireAdmin()` in `apps/server/src/common/middleware/auth.middleware.ts`
  - Role management: `Role` enum (CUSTOMER, ADMIN) in Prisma schema

## Monitoring & Observability

**Error Tracking:**
- None - No external error tracking service (Sentry, Bugsnag, etc.)
  - Custom error handler in `apps/server/src/common/middleware/error-handler.ts`

**Logs:**
- Console logging only - No structured logging service
  - Basic console.log statements for server startup and events
  - Event-driven logging via internal event bus

## CI/CD & Deployment

**Hosting:**
- Not specified - No deployment configuration detected

**CI Pipeline:**
- None - No CI/CD configuration files (.github/workflows, .gitlab-ci.yml, etc.)

**Local Development:**
- Docker Compose setup for databases (`docker-compose.yml`)
  - PostgreSQL service: `ecom-postgres` on port 5432
  - MongoDB service: `ecom-mongo` on port 27017
  - Persistent volumes: `postgres_data`, `mongo_data`

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment mode (development/production)
- `CLERK_SECRET_KEY` - Clerk authentication secret key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (client-side)
- `STRIPE_SECRET_KEY` - Stripe secret key for payment processing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `CLIENT_URL` - Client app URL (default: http://localhost:3002)
- `ADMIN_URL` - Admin app URL (default: http://localhost:3003)

**Secrets location:**
- `.env` file in project root (gitignored)
- `.env.example` provides template with placeholder values
- Loaded via `dotenv` package in `apps/server/src/config/index.ts`

## Webhooks & Callbacks

**Incoming:**
- `/api/payments/webhook` - Stripe webhook endpoint (planned)
  - Handler: `apps/server/src/modules/payment/payment.controller.ts:handleWebhook()`
  - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
  - Emits internal events: `payment.completed`, `payment.failed`

- Clerk webhooks - Not yet configured (user sync endpoint would handle user.created, user.updated events)

**Outgoing:**
- None - No webhooks sent to external services

## Internal Event System

**Event Bus:**
- Custom event emitter in `apps/server/src/common/events/event-bus.ts`
- Events:
  - `order.created` - Emitted when new order is created (`apps/server/src/modules/order/order.service.ts:create()`)
  - `order.updated` - Emitted when order status changes (`apps/server/src/modules/order/order.service.ts:updateStatus()`)
  - `payment.completed` - Emitted on successful payment (`apps/server/src/modules/payment/payment.service.ts:handleWebhook()`)
  - `payment.failed` - Emitted on failed payment
- Listeners registered in `apps/server/src/index.ts`

## API Documentation

**Documentation:**
- Swagger/OpenAPI integration configured
  - Generator: swagger-jsdoc 6.2.8
  - UI: swagger-ui-express 5.0.1
  - JSDoc annotations expected in route files

**Health Check:**
- `GET /api/health` - Server health check endpoint
  - Returns: `{ status: 'ok', timestamp: ISO8601 }`
  - Implementation: `apps/server/src/index.ts`

---

*Integration audit: 2026-03-10*
