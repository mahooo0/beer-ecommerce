# Coding Conventions

**Analysis Date:** 2026-03-10

## Naming Patterns

**Files:**
- TypeScript files: `kebab-case.ts` (e.g., `error-handler.ts`, `auth.middleware.ts`)
- React components: `kebab-case.tsx` (Next.js app directory uses `page.tsx`, `layout.tsx`)
- Config files: `kebab-case.config.ts` or `.configrc` format
- Module organization: Feature-based with `.controller.ts`, `.service.ts`, `.routes.ts` suffixes

**Functions:**
- camelCase for all functions and methods
- Async functions clearly marked with `async` keyword
- Controller methods named after HTTP operations: `getAll`, `getById`, `create`, `update`, `delete`
- Service methods match controller naming conventions

**Variables:**
- camelCase for local variables and parameters
- SCREAMING_SNAKE_CASE not observed (uses lowercase for imports like `config`)
- Destructured parameters inline in function signatures

**Types:**
- PascalCase for interfaces and types: `Product`, `CartItem`, `ApiResponse<T>`
- Generic types use single uppercase letters: `T`, `K`
- Prefixed with `I` only in Mongoose schemas: `IOrder`, `IOrderItem`, `IAddress`
- Type imports use `type` keyword: `import type { Request, Response } from 'express'`

**Classes:**
- PascalCase for class names: `AuthController`, `ProductService`, `AppError`, `EventBus`
- Singleton instances exported as camelCase: `authController`, `productService`, `eventBus`
- Pattern: `export const authController = new AuthController()`

## Code Style

**Formatting:**
- Tool: Prettier 3.7.4
- Semi-colons: Required (`"semi": true`)
- Quotes: Single quotes (`"singleQuote": true`)
- Tab width: 2 spaces
- Trailing commas: Always (`"trailingComma": "all"`)
- Print width: 100 characters
- Run command: `pnpm format` (formats `**/*.{ts,tsx,md}`)

**Linting:**
- Tool: ESLint 9.39.1 with flat config
- Base config: `@repo/eslint-config/base` (for Node.js apps)
- Next.js config: `@repo/eslint-config/next-js` (for React apps)
- TypeScript: `typescript-eslint` with recommended rules
- All warnings converted to warnings only via `eslint-plugin-only-warn`
- React rules: `eslint-plugin-react` with `react/react-in-jsx-scope` disabled (new JSX transform)
- React Hooks: `eslint-plugin-react-hooks` recommended rules
- Turbo: `turbo/no-undeclared-env-vars` as warning
- Run command: `pnpm lint` or app-specific `eslint --max-warnings 0`

**TypeScript:**
- Version: 5.9.2 (pinned across monorepo)
- Config: Extends `@repo/typescript-config/base.json`
- Strict mode: Enabled
- Target: ES2022
- Module: NodeNext (for Node.js apps)
- `noUncheckedIndexedAccess`: true
- `isolatedModules`: true
- Type-only imports: `import type { ... }` for types

## Import Organization

**Order:**
1. External packages (Node.js built-ins, third-party)
2. Workspace packages (`@repo/db`, `@repo/types`)
3. Internal modules (relative imports with `.js` extension)

**Pattern observed:**
```typescript
import express from 'express';
import cors from 'cors';
import { connectMongoDB } from '@repo/db';
import { config } from './config/index.js';
import { errorHandler } from './common/middleware/error-handler.js';
```

**Path Aliases:**
- Workspace packages: `@repo/db`, `@repo/types`, `@repo/eslint-config`, `@repo/typescript-config`
- No internal path aliases detected (uses relative imports)

**Import Extensions:**
- Server (Node.js ESM): Always include `.js` extension in imports
- Next.js apps: No extensions (handled by bundler)

## Error Handling

**Patterns:**
- Custom error class: `AppError` extends `Error` with `statusCode` property
- Location: `apps/server/src/common/middleware/error-handler.ts`
- Centralized error middleware: `errorHandler` catches all errors
- Controller pattern: All operations wrapped in try-catch, errors passed to `next(error)`
- Service layer: Throws `AppError` with appropriate status codes (404, 401, etc.)

**Example:**
```typescript
async getById(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.getById(req.params.id as string);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}
```

**Service layer:**
```typescript
async getUserByClerkId(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}
```

**Validation:**
- Library: Zod 3.25.0
- Middleware: `validate(schema)` in `apps/server/src/common/middleware/validate.ts`
- Pattern: Validates `req.body`, `req.query`, `req.params` together
- Returns 400 with validation details on failure

## Logging

**Framework:** `console` (no structured logging library)

**Patterns:**
- Startup information: `console.log()` for server start, environment, connections
- Errors: `console.error()` for unhandled errors in error middleware
- Events: `console.log()` with `[Event]` prefix for event bus notifications
- No debug/trace/info levels observed
- No request logging middleware detected

**Example:**
```typescript
console.log(`Server running on http://localhost:${config.port}`);
console.error('Unhandled error:', err);
console.log(`[Event] Order created: ${data.orderId}`);
```

## Comments

**When to Comment:**
- TODOs for incomplete implementations: `// TODO: Integrate with Stripe`, `// TODO: Verify token with Clerk`
- JSDoc comments for exported configs: `/** A shared ESLint configuration for the repository. */`
- Inline comments for clarification: `// React scope no longer necessary with new JSX transform.`

**JSDoc/TSDoc:**
- Used sparingly, primarily in config files
- Type annotations in config: `@type {import("eslint").Linter.Config[]}`
- No JSDoc on functions/classes observed in source code

## Function Design

**Size:** Functions are concise (5-20 lines typical for controller methods)

**Parameters:**
- Controllers: Explicit Express parameters `(req: Request, res: Response, next: NextFunction)`
- Services: Strongly typed parameters with interfaces or inline types
- Pagination: Defaults in function signature `(page = 1, limit = 20)`

**Return Values:**
- Controllers: void (response sent via `res.json()`)
- Services: Direct return of data (Promises implicitly via `async`)
- Consistent JSON response format: `{ success: boolean, data?: T, error?: string }`

**Async Patterns:**
- All database operations use async/await
- Parallel operations: `Promise.all()` for independent queries
- No callbacks observed

## Module Design

**Exports:**
- Named exports for classes: `export class AuthController`
- Singleton instances: `export const authController = new AuthController()`
- Default exports: React components and Next.js pages/layouts
- Type-only exports: `export type { IOrder, IOrderItem }`

**Barrel Files:**
- Package entry points: `packages/db/src/index.ts`, `packages/types/src/index.ts`
- Re-exports all public APIs from package
- No barrel files within app directories

**Module Pattern:**
- Server modules: Feature-based with controller/service/routes triads
- Each module exports singleton instances
- Routes import and compose controllers with middleware

**Dependency Injection:**
- Not used; services instantiated as singletons
- Dependencies imported directly (e.g., `import { prisma } from '@repo/db'`)

---

*Convention analysis: 2026-03-10*
