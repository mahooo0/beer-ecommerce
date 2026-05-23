# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Turborepo monorepo with microservices architecture - separate frontend apps consuming a shared REST API backend

**Key Characteristics:**
- Polyglot persistence (PostgreSQL via Prisma for products/users, MongoDB via Mongoose for orders)
- Service-oriented backend with module-based organization
- Shared type definitions across all applications
- Event-driven communication for cross-module coordination
- Workspace-based dependency management with pnpm

## Layers

**Presentation Layer (Next.js Apps):**
- Purpose: User interfaces for customers and administrators
- Location: `apps/client` (port 3002), `apps/admin` (port 3003)
- Contains: React components, API client wrappers, state management, routing
- Depends on: `@repo/types` package, backend API at port 4000
- Used by: End users (client) and administrators (admin)

**API Layer (Express Backend):**
- Purpose: RESTful API providing business logic and data access
- Location: `apps/server/src`
- Contains: HTTP routes, controllers, services, middleware
- Depends on: `@repo/db` package, `@repo/types` package
- Used by: Client app, admin app

**Service Layer:**
- Purpose: Business logic implementation for domain modules
- Location: `apps/server/src/modules/*/[module].service.ts`
- Contains: Service classes with CRUD operations, business rules, event emission
- Depends on: Database clients (Prisma/Mongoose), event bus, error handlers
- Used by: Controllers

**Controller Layer:**
- Purpose: HTTP request handling and response formatting
- Location: `apps/server/src/modules/*/[module].controller.ts`
- Contains: Controller classes mapping HTTP requests to service calls
- Depends on: Service layer
- Used by: Route definitions

**Data Access Layer:**
- Purpose: Database abstraction and ORM/ODM clients
- Location: `packages/db/src`
- Contains: Prisma client singleton, Mongoose models, connection logic
- Depends on: External databases (PostgreSQL, MongoDB)
- Used by: Server services

**Shared Types Layer:**
- Purpose: Type definitions shared across frontend and backend
- Location: `packages/types/src`
- Contains: TypeScript interfaces for domain entities, API responses
- Depends on: Nothing (pure types)
- Used by: All apps and server

## Data Flow

**Product Listing Flow:**

1. User visits client app at `/products`
2. Client calls `api.products.getAll()` → `GET /api/products`
3. Server routes to `productController.getAll()`
4. Controller calls `productService.getAll(page, limit)`
5. Service queries Prisma → PostgreSQL for products with pagination
6. Service returns `PaginatedResponse<Product>` with data, total, pages
7. Controller wraps in `{ success: true, ...result }`
8. Client receives JSON, renders product grid

**Order Creation Flow:**

1. User submits checkout from client app
2. Client calls `api.orders.create(orderData)` → `POST /api/orders`
3. Server routes to `orderController.create()`
4. Controller calls `orderService.create(orderData)`
5. Service saves to MongoDB via Mongoose `OrderModel.create()`
6. Service emits `eventBus.emit('order.created', { orderId, userId, totalAmount })`
7. Event listeners in `apps/server/src/index.ts` log the event
8. Service returns created order document
9. Controller returns `{ success: true, data: order }`
10. Client receives order confirmation

**State Management:**
- Client app uses Zustand for cart state with localStorage persistence
- Admin app has no state management (server state only)
- Server has no session state (stateless API)

## Key Abstractions

**Module Pattern:**
- Purpose: Organize backend features into self-contained domains
- Examples: `apps/server/src/modules/product`, `apps/server/src/modules/order`, `apps/server/src/modules/auth`, `apps/server/src/modules/payment`
- Pattern: Each module contains `[name].routes.ts`, `[name].controller.ts`, `[name].service.ts`

**Service Classes:**
- Purpose: Encapsulate business logic as singleton instances
- Examples: `productService`, `orderService`, `paymentService`
- Pattern: Export instantiated class `export const productService = new ProductService()`

**Database Split:**
- Purpose: Separate transactional data from operational data
- Examples: Products/Users in PostgreSQL (`prisma`), Orders in MongoDB (`OrderModel`)
- Pattern: Import from `@repo/db` - `prisma` for SQL, `OrderModel` for MongoDB

**API Client Abstraction:**
- Purpose: Centralized fetch wrapper for backend communication
- Examples: `apps/client/src/lib/api.ts`, `apps/admin/src/lib/api.ts`
- Pattern: Namespace object with domain methods (`api.products.getAll()`)

**Type-Safe Responses:**
- Purpose: Ensure type safety across network boundary
- Examples: `ApiResponse<T>`, `PaginatedResponse<T>` from `@repo/types`
- Pattern: Generic wrappers with `success`, `data`, `error` fields

## Entry Points

**Server Entry Point:**
- Location: `apps/server/src/index.ts`
- Triggers: `pnpm dev` (tsx watch) or `pnpm start` (compiled)
- Responsibilities: Express app setup, middleware registration, route mounting, MongoDB connection, event listener registration, HTTP server start on port 4000

**Client Entry Point:**
- Location: `apps/client/src/app/layout.tsx` and `apps/client/src/app/page.tsx`
- Triggers: Next.js App Router on port 3002
- Responsibilities: Root layout with navigation, page routing

**Admin Entry Point:**
- Location: `apps/admin/src/app/layout.tsx` and `apps/admin/src/app/page.tsx`
- Triggers: Next.js App Router on port 3003
- Responsibilities: Admin dashboard layout, metrics display

**Database Entry Points:**
- Prisma: `packages/db/src/prisma.ts` - Singleton client with dev hot-reload handling
- Mongoose: `packages/db/src/mongoose.ts` - Connection manager and model exports

## Error Handling

**Strategy:** Centralized error middleware with custom error types

**Patterns:**
- `AppError` class with status codes: `throw new AppError(404, 'Product not found')`
- Controllers use try-catch with `next(error)` passthrough
- Global error handler at `apps/server/src/common/middleware/error-handler.ts`
- Error middleware returns JSON: `{ success: false, error: message }`
- Unknown errors logged and return 500 with generic message

## Cross-Cutting Concerns

**Logging:** Console-based logging throughout (no framework). Event bus logs at `apps/server/src/index.ts` for `order.created` and `payment.completed` events.

**Validation:** Zod installed in server but not implemented. No request validation middleware active.

**Authentication:** Placeholder middleware at `apps/server/src/common/middleware/auth.middleware.ts`. Functions `requireAuth` and `requireAdmin` check for `Bearer` token but don't verify with Clerk yet. Contains TODO comments for integration.

**Event Bus:** Typed event emitter at `apps/server/src/common/events/event-bus.ts`. Supports strongly-typed events like `order.created`, `payment.completed`, `product.updated`. Services emit events after state changes.

**CORS:** Configured in `apps/server/src/index.ts` to allow `config.clientUrl` and `config.adminUrl` origins.

---

*Architecture analysis: 2026-03-10*
