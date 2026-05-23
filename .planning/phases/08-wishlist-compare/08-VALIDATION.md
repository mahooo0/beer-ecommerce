---
phase: 8
slug: wishlist-compare
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-11
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (project standard, see tests/setup.ts) |
| **Config file** | vitest.config.ts (workspace root) |
| **Quick run command** | `pnpm vitest run tests/wishlist/ tests/compare/` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/wishlist/ tests/compare/`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-00-01 | 00 | 0 | ALL | infra | `pnpm vitest run tests/wishlist/ tests/compare/` | Wave 0 | pending |
| 08-01-01 | 01 | 1 | WISH-01 | unit | `pnpm vitest run tests/wishlist/wishlist-service.test.ts` | Wave 0 | pending |
| 08-01-02 | 01 | 1 | WISH-01 | unit | `npx tsc --noEmit -p apps/server/tsconfig.json` | N/A | pending |
| 08-02-01 | 02 | 1 | WISH-04 | unit | `pnpm vitest run tests/compare/compare-store.test.ts` | Wave 0 | pending |
| 08-02-02 | 02 | 1 | WISH-01,WISH-02 | unit | `npx tsc --noEmit -p apps/client/tsconfig.json` | N/A | pending |
| 08-03-01 | 03 | 2 | WISH-03,WISH-06 | unit | `pnpm vitest run tests/wishlist/wishlist-page.test.ts tests/wishlist/wishlist-sync.test.ts tests/wishlist/price-drop-badge.test.ts` | Wave 0 | pending |
| 08-03-02 | 03 | 2 | WISH-01 | unit | `pnpm vitest run tests/wishlist/wishlist-button.test.ts` | Wave 0 | pending |
| 08-04-01 | 04 | 2 | WISH-04,WISH-05 | unit | `pnpm vitest run tests/compare/compare-page.test.ts` | Wave 0 | pending |
| 08-05-01 | 05 | 3 | WISH-06 | unit | `pnpm vitest run tests/wishlist/wishlist-events.test.ts` | Wave 0 | pending |
| 08-05-02 | 05 | 3 | WISH-06 | unit | `npx tsc --noEmit -p apps/server/tsconfig.json` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/wishlist/wishlist-store.test.ts` — stubs for WISH-01 (addItem, removeItem, hasItem, deduplication)
- [ ] `tests/wishlist/wishlist-button.test.ts` — stubs for WISH-01 (heart overlay render, toggle state)
- [ ] `tests/wishlist/wishlist-service.test.ts` — stubs for WISH-02 (getWishlist, addItem, removeItem, syncItems)
- [ ] `tests/wishlist/wishlist-sync.test.ts` — stubs for WISH-02 (useWishlistSync hook)
- [ ] `tests/wishlist/wishlist-page.test.ts` — stubs for WISH-03 (page renders product cards)
- [ ] `tests/wishlist/wishlist-events.test.ts` — stubs for WISH-06 (priceDrop and restock events)
- [ ] `tests/wishlist/price-drop-badge.test.ts` — stubs for WISH-06 (badge renders)
- [ ] `tests/compare/compare-store.test.ts` — stubs for WISH-04 (add/remove/clear, max 4)
- [ ] `tests/compare/compare-bar.test.ts` — stubs for WISH-04 (floating bar)
- [ ] `tests/compare/compare-page.test.ts` — stubs for WISH-05 (side-by-side table, diff highlighting)
- [ ] `tests/fixtures/wishlist.fixtures.ts` — shared mock fixtures
- [ ] Add `wishlist`, `wishlistItem` Prisma mocks to `tests/setup.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Heart fill animation | WISH-01 | CSS animation visual check | Click heart, verify smooth fill transition |
| Floating compare bar position | WISH-04 | Layout/position visual check | Select 2+ products, verify sticky bar at bottom |
| Price drop badge visual | WISH-06 | Color/layout visual check | Add item with price drop, verify badge on wishlist page |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** signed-off (2026-03-11)
