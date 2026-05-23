# Codebase Structure

**Analysis Date:** 2026-03-10

## Directory Layout

```
ecom-template/
├── apps/                     # Application workspaces
│   ├── server/              # Express 5 REST API (port 4000)
│   ├── client/              # Next.js 16 customer frontend (port 3002)
│   └── admin/               # Next.js 16 admin panel (port 3003)
├── packages/                # Shared packages
│   ├── db/                  # Database clients (Prisma + Mongoose)
│   ├── types/               # Shared TypeScript types
│   ├── eslint-config/       # Shared ESLint configuration
│   └── typescript-config/   # Base tsconfig.json files
├── .planning/               # GSD planning documents
│   └── codebase/           # Codebase analysis docs
├── docker-compose.yml       # PostgreSQL + MongoDB services
├── turbo.json              # Turborepo pipeline configuration
└── pnpm-workspace.yaml     # pnpm workspace definition
```

## Directory Purposes

**`apps/server/`:**
- Purpose: Express backend API server
- Contains: TypeScript source with modules, middleware, config
- Key files:
  - `src/index.ts` - Express app entry point
  - `src/config/index.ts` - Environment configuration
  - `package.json` - Server dependencies (express, cors, zod, swagger)

**`apps/server/src/modules/`:**
- Purpose: Feature modules organized by domain
- Contains: Controller, service, and route files per module
- Key modules:
  - `product/` - Product CRUD operations (Prisma)
  - `order/` - Order management (Mongoose)
  - `auth/` - User authentication (placeholder)
  - `payment/` - Stripe integration (placeholder)

**`apps/server/src/common/`:**
- Purpose: Shared server utilities and cross-cutting concerns
- Contains: Middleware, event bus, shared logic
- Key files:
  - `middleware/error-handler.ts` - AppError class and global error handler
  - `middleware/auth.middleware.ts` - Authentication guards (placeholder)
  - `middleware/validate.ts` - Request validation (not implemented)
  - `events/event-bus.ts` - Typed event emitter

**`apps/client/`:**
- Purpose: Customer-facing e-commerce storefront
- Contains: Next.js App Router pages, components, API client, Zustand store
- Key files:
  - `src/app/layout.tsx` - Root layout with navigation
  - `src/app/page.tsx` - Homepage
  - `src/lib/api.ts` - Backend API wrapper
  - `src/stores/cart-store.ts` - Zustand cart state with persistence
  - `next.config.ts` - Transpiles `@repo/types`

**`apps/admin/`:**
- Purpose: Admin dashboard for managing products, orders, users
- Contains: Next.js App Router pages, API client with admin methods
- Key files:
  - `src/app/page.tsx` - Dashboard with metrics
  - `src/lib/api.ts` - Admin API client (CRUD for products, orders)
  - `src/components/` - Empty (no reusable components yet)

**`packages/db/`:**
- Purpose: Centralized database access layer
- Contains: Prisma schema, Mongoose models, client exports
- Key files:
  - `src/index.ts` - Barrel export for both clients
  - `src/prisma.ts` - Prisma client singleton
  - `src/mongoose.ts` - Mongoose connection and OrderModel
  - `prisma/schema.prisma` - PostgreSQL schema (User, Product, Category, ProductVariant)

**`packages/types/`:**
- Purpose: Shared TypeScript type definitions
- Contains: Domain interfaces, API response types
- Key files:
  - `src/index.ts` - All type exports (Product, Order, ApiResponse, PaginatedResponse, etc.)

**`packages/eslint-config/`:**
- Purpose: Shared ESLint rules for monorepo
- Contains: ESLint configuration presets
- Key files: `package.json` with ESLint dependencies

**`packages/typescript-config/`:**
- Purpose: Base TypeScript compiler configs
- Contains: Reusable tsconfig.json files
- Key files: `node.json` for Node.js apps

## Key File Locations

**Entry Points:**
- `apps/server/src/index.ts` - Backend server startup
- `apps/client/src/app/layout.tsx` - Client root layout
- `apps/admin/src/app/layout.tsx` - Admin root layout

**Configuration:**
- `turbo.json` - Build pipeline with task dependencies
- `pnpm-workspace.yaml` - Workspace package paths
- `docker-compose.yml` - Local database services
- `.env.example` - Environment variable template
- `apps/server/src/config/index.ts` - Runtime config with env vars

**Core Logic:**
- `apps/server/src/modules/*/[name].service.ts` - Business logic per domain
- `packages/db/src/prisma.ts` - SQL database client
- `packages/db/src/mongoose.ts` - NoSQL database client
- `apps/client/src/stores/cart-store.ts` - Client-side state

**Testing:**
- No test files found (no `.test.ts` or `.spec.ts` files)
- No test framework configuration detected

**Schemas:**
- `packages/db/prisma/schema.prisma` - PostgreSQL data model

## Naming Conventions

**Files:**
- Modules: `[domain].routes.ts`, `[domain].controller.ts`, `[domain].service.ts`
- Next.js pages: `page.tsx`, `layout.tsx`
- Config files: `[tool].config.[ts|js|mjs]`
- Types: `index.ts` (barrel exports)

**Directories:**
- Module names: lowercase, singular (`product`, `order`, `auth`)
- App names: lowercase (`server`, `client`, `admin`)
- Package names: kebab-case (`eslint-config`, `typescript-config`)

**Classes:**
- PascalCase for class names: `ProductService`, `AppError`, `EventBus`
- Exported as camelCase singletons: `productService`, `eventBus`

**Types:**
- PascalCase for interfaces: `Product`, `Order`, `ApiResponse<T>`
- Prefixed with `I` for Mongoose documents: `IOrder`, `IOrderItem`

## Where to Add New Code

**New Feature Module:**
- Primary code: `apps/server/src/modules/[feature-name]/`
- Create three files: `[name].routes.ts`, `[name].controller.ts`, `[name].service.ts`
- Register routes in `apps/server/src/index.ts` with `app.use('/api/[feature]', [feature]Routes)`
- Add types to `packages/types/src/index.ts`

**New API Endpoint:**
- Routes: `apps/server/src/modules/[module]/[module].routes.ts`
- Controller method: `apps/server/src/modules/[module]/[module].controller.ts`
- Service method: `apps/server/src/modules/[module]/[module].service.ts`

**New Frontend Page:**
- Client: `apps/client/src/app/[route]/page.tsx`
- Admin: `apps/admin/src/app/[route]/page.tsx`

**New React Component:**
- Client: `apps/client/src/components/[ComponentName].tsx` (directory empty, create as needed)
- Admin: `apps/admin/src/components/[ComponentName].tsx` (directory empty, create as needed)

**New Database Model:**
- Prisma: Add model to `packages/db/prisma/schema.prisma`, run `pnpm db:generate`
- Mongoose: Add schema and model to `packages/db/src/mongoose.ts`, export from `packages/db/src/index.ts`

**New Shared Type:**
- Add interface to `packages/types/src/index.ts`
- Automatically available in all apps via workspace dependency

**Utilities:**
- Server utilities: `apps/server/src/common/` (create subdirectories as needed)
- Client utilities: `apps/client/src/lib/` or `apps/admin/src/lib/`

**Middleware:**
- Add to `apps/server/src/common/middleware/[name].ts`
- Register in `apps/server/src/index.ts` or in module routes

## Special Directories

**`node_modules/`:**
- Purpose: Installed dependencies (pnpm symlinks)
- Generated: Yes (by pnpm install)
- Committed: No (.gitignore)

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (by next build/dev)
- Committed: No (.gitignore)

**`dist/`:**
- Purpose: Compiled TypeScript output for server
- Generated: Yes (by tsc in apps/server)
- Committed: No (.gitignore)

**`packages/db/prisma/migrations/`:**
- Purpose: Prisma migration history
- Generated: Yes (by prisma migrate)
- Committed: Yes (migrations should be versioned)

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents
- Generated: By GSD map-codebase command
- Committed: Yes (planning documents are part of project)

**`apps/[app]/public/`:**
- Purpose: Static assets served by Next.js
- Generated: No (manually added)
- Committed: Yes

---

*Structure analysis: 2026-03-10*
