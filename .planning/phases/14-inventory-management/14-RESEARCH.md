# Phase 14: Inventory Management - Research

**Researched:** 2026-03-11
**Domain:** Inventory management, atomic stock reservations, multi-warehouse allocation, SKU generation
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INV-01 | Stock tracked per SKU (variant-level) with real-time quantities | Schema already has `InventoryItem` per `variantId+warehouseId`; service layer reads/writes `quantity` field |
| INV-02 | Low stock alerts configurable per product with threshold | `lowStockThreshold` field exists on `InventoryItem`; alert logic fires when `quantity - reserved <= threshold` |
| INV-03 | Admin can manage multiple warehouses with location and priority | `Warehouse` model complete with `latitude`, `longitude`, `priority`; CRUD service + admin UI needed |
| INV-04 | Stock allocation per warehouse with intelligent routing to nearest warehouse | Haversine formula on lat/lng from Warehouse; pick warehouse with highest priority + available stock |
| INV-05 | Atomic stock reservation with TTL (15 min) during checkout, commit on payment, release on abandon | Prisma `$transaction` for atomicity; TTL managed via a scheduled BullMQ job or cron that releases expired reservations |
| INV-06 | Admin inventory dashboard showing stock levels, alerts, and movement history | Server-side aggregate query + admin Next.js page; movement history from `StockMovement` table |
| INV-07 | Stock adjustment history with reason tracking (sale, return, manual, damage) | `StockMovement` model + `StockMovementReason` enum already in schema |
| INV-08 | SKU auto-generation based on product attributes | Deterministic algorithm: `{PRODUCT_CODE}-{OPTION_VALUES}` uppercased and slugified |
</phase_requirements>

---

## Summary

Phase 14 implements inventory management on top of a schema that is **fully pre-built in Phase 1**. The `Warehouse`, `InventoryItem`, `StockMovement`, and `StockMovementReason` models are already in `packages/db/prisma/schema.prisma`. No schema migration is required. The work is entirely service/API/UI implementation.

The most technically demanding requirements are **INV-05** (atomic reservation with TTL) and **INV-04** (nearest-warehouse routing). INV-05 requires Prisma `$transaction` with a `reserved` field increment and a mechanism to release holds after 15 minutes — the correct approach is a lightweight cleanup service (cron or Redis TTL trigger). INV-04 requires the Haversine distance formula applied to warehouse coordinates.

The admin UI follows the same "client component + `api.*` fetcher" pattern established by the shipping module. All quantities are integers (cents pattern for money also applies to stock: always integers). Monetary values in movement history stay in cents.

**Primary recommendation:** Build an `InventoryService` class mirroring `ShippingService` structure, expose `/api/inventory` routes, and build admin pages under `/dashboard/inventory`. Extend `tests/setup.ts` with `warehouse`, `inventoryItem`, and `stockMovement` Prisma mocks.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@prisma/client` | already installed | ORM for all 3 inventory tables | Pre-existing; entire project uses it |
| `zod` | already installed | Input validation for all routes | Consistent with every other module |
| `express` | already installed | HTTP layer for `/api/inventory` routes | Pre-existing server framework |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node-cron` | ^3.x | Release expired reservations every minute | Lightweight scheduler, no Redis needed for this TTL task |
| built-in `Math` | n/a | Haversine formula for distance calculation | Pure math — no library needed for this |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `node-cron` for TTL cleanup | BullMQ delayed jobs | BullMQ is heavier (needs Redis); `node-cron` is sufficient for a 1-minute TTL sweep |
| Custom Haversine | `geolib` npm package | `geolib` adds a dependency for one formula that is 10 lines of Math |
| In-memory alert queue | Database polling | Polling the DB every minute for low-stock alerts is adequate at this scale; event-driven is better for v2 |

**Installation (only if `node-cron` not already present):**
```bash
pnpm add node-cron
pnpm add -D @types/node-cron
```

---

## Architecture Patterns

### Recommended Project Structure

```
apps/server/src/modules/inventory/
├── inventory.service.ts        # Business logic: CRUD, reservations, movements
├── inventory.controller.ts     # Express request handlers
├── inventory.routes.ts         # Route definitions (admin-protected + public reserve)
├── inventory.validation.ts     # Zod schemas for all endpoints
└── reservation.cleanup.ts      # node-cron job: release expired reservations

apps/admin/src/app/dashboard/inventory/
├── page.tsx                    # Dashboard: stock levels overview + active alerts
├── warehouses/
│   ├── page.tsx               # Warehouse list
│   ├── create-warehouse-form.tsx
│   └── [id]/
│       ├── page.tsx           # Warehouse detail + inventory items
│       └── edit-warehouse-form.tsx
├── movements/
│   └── page.tsx               # Movement history with reason filter
└── adjustments/
    └── page.tsx               # Manual stock adjustment form

tests/inventory/
├── inventory.service.test.ts  # Unit tests for service methods
└── reservation.test.ts        # Unit tests for atomic reservation logic

tests/fixtures/
└── inventory.fixtures.ts      # Mock warehouse, inventoryItem, stockMovement data
```

### Pattern 1: Atomic Reservation via Prisma $transaction

**What:** Increment `reserved` on `InventoryItem` inside a transaction to guarantee no race condition between concurrent checkouts for the same SKU.

**When to use:** Every time a checkout session begins holding stock (INV-05).

**Example:**
```typescript
// Source: Prisma official docs - interactive transactions
async reserveStock(variantId: string, warehouseId: string, qty: number, checkoutId: string) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: { variantId_warehouseId: { variantId, warehouseId } },
    });
    if (!item) throw new AppError(404, 'Inventory item not found');
    const available = item.quantity - item.reserved;
    if (available < qty) throw new AppError(409, 'Insufficient stock');

    await tx.inventoryItem.update({
      where: { id: item.id },
      data: { reserved: { increment: qty } },
    });

    await tx.stockMovement.create({
      data: {
        inventoryItemId: item.id,
        quantity: -qty,
        reason: 'RESERVATION',
        reference: checkoutId,
      },
    });

    return item;
  });
}
```

### Pattern 2: TTL Reservation Cleanup with node-cron

**What:** A cron job that finds stock movements with reason RESERVATION that are older than 15 minutes and have no corresponding RESERVATION_RELEASE or SALE, then releases the hold.

**When to use:** Background task on server startup (INV-05).

**Example:**
```typescript
// reservation.cleanup.ts
import cron from 'node-cron';
import { prisma } from '@repo/db';

export function startReservationCleanup() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const expired = await prisma.stockMovement.findMany({
      where: {
        reason: 'RESERVATION',
        createdAt: { lt: cutoff },
        // Only unreleased reservations
        inventoryItem: {
          movements: {
            none: {
              reason: 'RESERVATION_RELEASE',
              reference: { equals: undefined }, // matched by reference field in real impl
            },
          },
        },
      },
    });
    // Release each expired reservation
    for (const movement of expired) {
      await releaseReservation(movement.reference!, Math.abs(movement.quantity));
    }
  });
}
```

**Note:** The reference field on StockMovement should store the checkout session ID. Match RESERVATION and RESERVATION_RELEASE movements by reference to avoid double-releases.

### Pattern 3: Nearest-Warehouse Routing with Haversine

**What:** When allocating stock for an order, pick the warehouse that has sufficient available stock and is closest to the shipping address.

**When to use:** INV-04 — order fulfillment allocation.

**Example:**
```typescript
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async findBestWarehouse(variantId: string, qty: number, destLat: number, destLon: number) {
  const items = await prisma.inventoryItem.findMany({
    where: { variantId, warehouse: { isActive: true } },
    include: { warehouse: true },
  });

  const eligible = items.filter((i) => i.quantity - i.reserved >= qty);
  if (eligible.length === 0) return null;

  // Sort by distance if coordinates available, else by priority
  eligible.sort((a, b) => {
    if (a.warehouse.latitude && b.warehouse.latitude) {
      const da = haversineDistance(destLat, destLon, a.warehouse.latitude, a.warehouse.longitude!);
      const db = haversineDistance(destLat, destLon, b.warehouse.latitude, b.warehouse.longitude!);
      return da - db;
    }
    return b.warehouse.priority - a.warehouse.priority; // fallback: highest priority first
  });

  return eligible[0]!;
}
```

### Pattern 4: SKU Auto-Generation

**What:** Deterministic SKU from product SKU prefix + variant option values.

**When to use:** INV-08 — whenever a new variant is created without an explicit SKU.

**Example:**
```typescript
function generateVariantSku(productSku: string, options: Record<string, string>): string {
  const parts = Object.values(options)
    .map((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))
    .join('-');
  return `${productSku}-${parts}`;
}
// e.g., generateVariantSku('TSHIRT-001', { size: 'Large', color: 'Red Blue' })
// => 'TSHIRT-001-LARG-REDB'
```

### Pattern 5: Low-Stock Alert Query

**What:** Aggregate query that finds all InventoryItems where available stock is at or below the threshold.

**When to use:** INV-02 dashboard alerts and NOTF-07 (Phase 17 email notifications).

**Example:**
```typescript
async getLowStockAlerts() {
  // Prisma raw query needed because available = quantity - reserved
  const items = await prisma.$queryRaw<any[]>`
    SELECT
      ii.id, ii."variantId", ii."warehouseId",
      ii.quantity, ii.reserved, ii."lowStockThreshold",
      (ii.quantity - ii.reserved) AS available,
      pv.sku, p.name AS "productName", w.name AS "warehouseName"
    FROM inventory_items ii
    JOIN product_variants pv ON pv.id = ii."variantId"
    JOIN products p ON p.id = pv."productId"
    JOIN warehouses w ON w.id = ii."warehouseId"
    WHERE (ii.quantity - ii.reserved) <= ii."lowStockThreshold"
    ORDER BY available ASC
  `;
  return items;
}
```

### Anti-Patterns to Avoid

- **Double-counting reserved stock:** Never show `quantity` alone in the UI — always show `quantity - reserved` as the available figure.
- **Non-atomic increments:** Never `UPDATE inventory_items SET reserved = reserved + 1` outside a transaction — use Prisma's `{ increment: qty }` inside `$transaction`.
- **Hardcoded 15-minute TTL in application logic:** Store the reservation expiry as a timestamp in the reference field or a separate table so cleanup is reliable and auditable.
- **SKU collision:** After auto-generating a SKU, always check uniqueness with `prisma.productVariant.findUnique({ where: { sku } })` and append a numeric suffix if taken.
- **Cascade deletes without stock release:** When a checkout is cancelled, always release reservations explicitly before cleanup — don't rely on cascade deletes to decrement `reserved`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic increment | Custom "check then update" in two queries | Prisma `{ increment: N }` inside `$transaction` | Two-query approach has a race condition window |
| Distance calculation | npm `geolib` package | 10-line Haversine in service | No extra dependency; formula is well-established |
| Scheduled cleanup | Redis/BullMQ complex queue | `node-cron` minute sweep | BullMQ is overkill for this single scheduled task |
| Movement audit trail | Custom audit log table | `StockMovement` model already in schema | Schema already covers this; don't diverge |

**Key insight:** The schema is complete. The entire phase is service-layer and UI work on top of existing Prisma models.

---

## Common Pitfalls

### Pitfall 1: Available Stock Calculation
**What goes wrong:** Code displays `inventoryItem.quantity` as the available stock, not accounting for reserved holds. Checkout oversells because reserved stock appears available.
**Why it happens:** `reserved` field is easy to forget; `quantity` alone looks correct.
**How to avoid:** Define a computed helper `available(item) = item.quantity - item.reserved` and use it everywhere. Never expose raw `quantity` to UI or checkout logic.
**Warning signs:** Tests pass with `quantity > 0` but orders fail at payment when two users check out the last item simultaneously.

### Pitfall 2: Race Condition on Reservation
**What goes wrong:** Two concurrent checkout requests both read `available = 1`, both succeed in reserving, now `reserved = 2` with `quantity = 1`.
**Why it happens:** Read-then-write without locking.
**How to avoid:** All reservation operations MUST use Prisma `$transaction` with `{ increment: qty }` — Prisma uses PostgreSQL row-level locking inside transactions. Check availability inside the transaction before incrementing.
**Warning signs:** Negative available stock in monitoring; oversold orders appear.

### Pitfall 3: Orphaned Reservations
**What goes wrong:** User abandons checkout tab; reservation never gets released; stock appears held indefinitely.
**Why it happens:** No TTL mechanism.
**How to avoid:** The cron cleanup job must run on server startup. Match RESERVATION movements to RESERVATION_RELEASE by `reference` (checkout session ID). Verify cron is started in `apps/server/src/index.ts` in the `start()` function.
**Warning signs:** `reserved` field grows over time; available stock keeps dropping without sales.

### Pitfall 4: SKU Uniqueness After Auto-Generation
**What goes wrong:** Two variants with identical option combinations (e.g., XL/Red for two different product types) get the same generated SKU.
**Why it happens:** SKU generation doesn't include a product-specific prefix or doesn't check uniqueness.
**How to avoid:** Always prefix with the parent product's SKU code. Always verify uniqueness post-generation with a DB lookup and append `-2`, `-3` suffix if collision detected.
**Warning signs:** Prisma unique constraint violation on `productVariant.sku`.

### Pitfall 5: $transaction Not in Prisma Mock
**What goes wrong:** Tests fail or are silently misconfigured because `$transaction` isn't mocked for inventory operations.
**Why it happens:** The existing `prismaMock.$transaction` in `tests/setup.ts` supports callback style but `inventoryItem`, `warehouse`, and `stockMovement` models aren't yet in the mock.
**How to avoid:** Wave 0 plan MUST extend `prismaMock` in `tests/setup.ts` with `warehouse`, `inventoryItem`, and `stockMovement` mocks using the same `vi.hoisted()` pattern used for shipping.
**Warning signs:** `Cannot read property 'findUnique' of undefined` in inventory service tests.

---

## Code Examples

Verified patterns from official sources and project conventions:

### Prisma $transaction with row-level atomicity
```typescript
// Source: Prisma docs - https://www.prisma.io/docs/orm/prisma-client/queries/transactions
// Pattern: Interactive transaction (callback style) - same as used in Phase 04 category tree
const result = await prisma.$transaction(async (tx) => {
  const item = await tx.inventoryItem.findUnique({ where: { ... } });
  if (!item) throw new Error('Not found');
  return tx.inventoryItem.update({
    where: { id: item.id },
    data: { reserved: { increment: quantity } },
  });
});
```

### Zod validation for stock adjustment endpoint
```typescript
// Pattern consistent with shipping.validation.ts
export const adjustStockSchema = z.object({
  body: z.object({
    variantId: z.string().cuid(),
    warehouseId: z.string().cuid(),
    quantity: z.number().int(), // positive = add, negative = remove
    reason: z.enum(['SALE', 'RETURN', 'MANUAL_ADJUSTMENT', 'DAMAGE', 'RESTOCK']),
    note: z.string().max(500).optional(),
    reference: z.string().optional(),
  }),
});
```

### Controller response pattern (consistent with all other modules)
```typescript
// Pattern from shipping.controller.ts
async getInventoryDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await inventoryService.getDashboardData();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
```

### Admin client fetch pattern (consistent with shipping zones page)
```typescript
// 'use client' component pattern — same as shipping/zones/page.tsx
const [items, setItems] = useState<InventoryItem[]>([]);
useEffect(() => {
  api.inventory.getAll().then(r => r.success && setItems(r.data));
}, []);
```

### Extending tests/setup.ts for inventory mocks
```typescript
// Add inside prismaMock = vi.hoisted(() => { ... })
warehouse: {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
},
inventoryItem: {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
},
stockMovement: {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  createMany: vi.fn(),
  count: vi.fn(),
},
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate reservation table | `reserved` field on `InventoryItem` | Design choice in Phase 1 | Simpler queries; reservation state lives with stock |
| Polling for stale reservations | `node-cron` sweep | Standard since Node.js ecosystem matured | No external dependency for simple TTL use case |
| String-based stock tracking | Integer quantities (consistent with cents-for-money pattern) | Phase 1 decision | No floating point issues in stock math |

**Deprecated/outdated:**
- Storing reservations as separate MongoDB documents: the project uses PostgreSQL for inventory; reservation state is on the `InventoryItem` row.

---

## Open Questions

1. **Reservation storage: reference format**
   - What we know: `StockMovement.reference` is a nullable `String`; it can hold a checkout session ID
   - What's unclear: The checkout session ID format isn't defined until Phase 10 (Checkout)
   - Recommendation: Use a UUID-format `checkoutSessionId` string in Phase 14; Phase 10 will adopt whatever format is established here

2. **Low-stock email notifications**
   - What we know: INV-02 requires alerts to fire; NOTF-07 (Phase 17) specifies email delivery
   - What's unclear: Phase 17 (Notifications via Resend) is not yet built
   - Recommendation: In Phase 14, emit a `inventory.lowStock` event on the existing `eventBus`; Phase 17 will subscribe to it. Don't build email sending in Phase 14.

3. **Warehouse coordinates for routing**
   - What we know: `latitude` and `longitude` are nullable on the `Warehouse` model
   - What's unclear: Admin may not always provide coordinates; routing algorithm must degrade gracefully
   - Recommendation: Fall back to warehouse `priority` field when coordinates are null (already shown in Haversine code example above)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (workspace root `vitest.config.ts`) |
| Config file | `/vitest.config.ts` |
| Quick run command | `pnpm vitest run tests/inventory/` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INV-01 | Real-time quantity reads per variant | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 |
| INV-02 | Low stock alert query fires below threshold | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 |
| INV-03 | Warehouse CRUD (create, list, update, delete) | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 |
| INV-04 | Nearest-warehouse routing with Haversine | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 |
| INV-05 | Atomic reserve, commit, release cycle | unit | `pnpm vitest run tests/inventory/reservation.test.ts` | Wave 0 |
| INV-06 | Dashboard aggregate returns stock + alerts | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 |
| INV-07 | Movement history records reason correctly | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 |
| INV-08 | SKU auto-generation uniqueness | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run tests/inventory/`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/inventory/inventory.service.test.ts` — covers INV-01 through INV-04, INV-06, INV-07, INV-08
- [ ] `tests/inventory/reservation.test.ts` — covers INV-05 atomic reservation
- [ ] `tests/fixtures/inventory.fixtures.ts` — mock warehouse, inventoryItem, stockMovement objects
- [ ] `tests/setup.ts` — add `warehouse`, `inventoryItem`, `stockMovement` to `prismaMock` using existing `vi.hoisted()` pattern

---

## Sources

### Primary (HIGH confidence)
- `/packages/db/prisma/schema.prisma` — Complete `Warehouse`, `InventoryItem`, `StockMovement`, `StockMovementReason` models verified directly
- `/apps/server/src/modules/shipping/` — All four files read; establishes the exact service/controller/routes/validation pattern to replicate
- `/tests/setup.ts` — Full prismaMock structure read; Wave 0 gaps identified precisely
- `/apps/admin/src/app/dashboard/shipping/zones/page.tsx` — Admin UI pattern confirmed: `'use client'` + `api.*` fetcher + Tailwind table

### Secondary (MEDIUM confidence)
- Prisma `$transaction` interactive transactions — standard documented pattern; project already uses it in Phase 04 category tree service
- `node-cron` for scheduled cleanup — established npm package; zero additional infrastructure required

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are pre-existing in the project; no net-new decisions required
- Architecture: HIGH — schema is complete; patterns are directly derived from the shipping module implementation already in codebase
- Pitfalls: HIGH — race condition and orphaned reservation pitfalls are well-documented concurrency issues; verified against project's existing Prisma transaction usage

**Research date:** 2026-03-11
**Valid until:** 2026-09-11 (stable domain; Prisma and node-cron APIs are not fast-moving)
