---
phase: 08-wishlist-compare
plan: "01"
subsystem: server-wishlist
tags: [wishlist, express, prisma, zod, rest-api]
dependency_graph:
  requires: ["08-00"]
  provides: ["wishlist-api"]
  affects: ["apps/server"]
tech_stack:
  added: []
  patterns: [upsert-deduplication, getOrCreate, requireAuth-middleware]
key_files:
  created:
    - apps/server/src/modules/wishlist/wishlist.validation.ts
    - apps/server/src/modules/wishlist/wishlist.service.ts
    - apps/server/src/modules/wishlist/wishlist.controller.ts
    - apps/server/src/modules/wishlist/wishlist.routes.ts
  modified:
    - apps/server/src/index.ts
decisions:
  - "getOrCreateWishlist lazy-creates wishlist on first use — no migration needed for existing users"
  - "upsert with update:{} for addItem and syncItems — skip-if-exists deduplication without error"
  - "getAuth(req) from @clerk/express to extract userId after requireAuth middleware"
metrics:
  duration: "4m"
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 08 Plan 01: Server Wishlist Module Summary

**One-liner:** REST wishlist API with Zod validation, upsert-based deduplication, and guest-to-auth sync via Express + Prisma.

## What Was Built

Complete `/api/wishlist` backend module with 6 endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/wishlist` | Get full wishlist with product details |
| GET | `/api/wishlist/count` | Get item count |
| POST | `/api/wishlist` | Add item (upsert — skip if exists) |
| DELETE | `/api/wishlist/:productId` | Remove item |
| POST | `/api/wishlist/sync` | Bulk merge guest localStorage items |
| PATCH | `/api/wishlist/:productId/notify` | Toggle price drop / restock notifications |

All endpoints require authentication via `requireAuth` middleware. Guests use localStorage only.

## Decisions Made

- **getOrCreateWishlist pattern:** Lazy-creates the DB wishlist record on first authenticated request — no migration needed for existing users without a wishlist row.
- **upsert with empty update for addItem:** Uses `upsert({ update: {} })` so adding an already-wishlisted product is a no-op rather than an error — clean UX and idempotent.
- **syncItems returns count not items:** Returns `{ merged: N }` count instead of full item list — client already has the local items and only needs confirmation of sync completion.
- **getAuth(req) not req.auth:** Follows Clerk Express v2 pattern for extracting `userId` after `requireAuth` middleware runs.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

- [x] `apps/server/src/modules/wishlist/wishlist.validation.ts` — created
- [x] `apps/server/src/modules/wishlist/wishlist.service.ts` — created
- [x] `apps/server/src/modules/wishlist/wishlist.controller.ts` — created
- [x] `apps/server/src/modules/wishlist/wishlist.routes.ts` — created
- [x] `apps/server/src/index.ts` — modified with import and route mount
- [x] Task 1 commit: `1e0e144`
- [x] Task 2 commit: `5bf2953`
- [x] TypeScript compiles without wishlist-related errors

## Self-Check: PASSED
