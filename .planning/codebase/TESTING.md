# Testing Patterns

**Analysis Date:** 2026-03-10

## Test Framework

**Runner:**
- Not detected (no Jest, Vitest, or other test runner configured)

**Assertion Library:**
- Not detected

**Run Commands:**
- No test scripts in `package.json` files
- Root `package.json` does not include test commands
- Individual app `package.json` files do not define test scripts

## Test File Organization

**Location:**
- No test files detected in codebase

**Naming:**
- No naming pattern established (no `.test.ts`, `.spec.ts`, or `__tests__` directories found)

**Structure:**
- Not applicable - no test files present

## Test Structure

**Suite Organization:**
- No test suites present

**Patterns:**
- Not established

## Mocking

**Framework:**
- Not detected

**Patterns:**
- Not established

**What to Mock:**
- Not defined

**What NOT to Mock:**
- Not defined

## Fixtures and Factories

**Test Data:**
- No fixtures or factories detected

**Location:**
- Not applicable

## Coverage

**Requirements:** None enforced

**View Coverage:**
- No coverage tooling configured

## Test Types

**Unit Tests:**
- Not present

**Integration Tests:**
- Not present

**E2E Tests:**
- Not present

## Common Patterns

**Async Testing:**
- Not established

**Error Testing:**
- Not established

## Recommendations

**Testing infrastructure needed:**

1. **Add test framework** - Recommend Vitest for TypeScript/ESM support
   - Install: `vitest`, `@vitest/ui` (optional)
   - Configure: `vitest.config.ts` in each app/package

2. **Test structure** - Co-located tests recommended for this architecture
   - Pattern: `src/**/*.test.ts` alongside source files
   - Naming: `{feature}.test.ts` or `{feature}.spec.ts`

3. **Server testing approach:**
   - Unit tests: Test service layer methods with mocked Prisma/Mongoose
   - Integration tests: Test API routes with real test database
   - Mock external services: Clerk auth, Stripe payments

4. **Next.js testing approach:**
   - Component tests: React Testing Library
   - Hook tests: `@testing-library/react-hooks` or direct Vitest
   - State management: Test Zustand stores in isolation

5. **Shared package testing:**
   - `@repo/types`: No runtime code, types only (no tests needed)
   - `@repo/db`: Test Prisma/Mongoose client initialization

6. **Coverage targets:**
   - Start with 60% coverage baseline
   - Critical paths (auth, payment, order creation) should reach 80%+

7. **Mocking strategy:**
   - Mock Prisma: Use `jest-mock-extended` or manual mocks
   - Mock Mongoose: Use `mongodb-memory-server` for integration tests
   - Mock external APIs: Use `msw` (Mock Service Worker)
   - Mock Next.js router: Use `next-router-mock`

8. **Example test structure for server:**
```typescript
// apps/server/src/modules/product/product.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService } from './product.service';
import { prisma } from '@repo/db';

vi.mock('@repo/db', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('ProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get all products', async () => {
    // Test implementation
  });
});
```

9. **Example test structure for Next.js:**
```typescript
// apps/client/src/stores/cart-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cart-store';

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('should add item to cart', () => {
    // Test implementation
  });
});
```

10. **Scripts to add to package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

*Testing analysis: 2026-03-10*
