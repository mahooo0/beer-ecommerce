---
phase: 14
slug: inventory-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (workspace root `vitest.config.ts`) |
| **Config file** | `/vitest.config.ts` |
| **Quick run command** | `pnpm vitest run tests/inventory/` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/inventory/`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-00-01 | 00 | 0 | INV-01..08 | stub | `pnpm vitest run tests/inventory/` | Wave 0 | ⬜ pending |
| 14-01-01 | 01 | 1 | INV-01 | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 | ⬜ pending |
| 14-01-02 | 01 | 1 | INV-02 | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 | ⬜ pending |
| 14-01-03 | 01 | 1 | INV-08 | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 | ⬜ pending |
| 14-02-01 | 02 | 1 | INV-03 | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 | ⬜ pending |
| 14-02-02 | 02 | 1 | INV-04 | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 | ⬜ pending |
| 14-03-01 | 03 | 2 | INV-05 | unit | `pnpm vitest run tests/inventory/reservation.test.ts` | Wave 0 | ⬜ pending |
| 14-04-01 | 04 | 3 | INV-06 | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 | ⬜ pending |
| 14-04-02 | 04 | 3 | INV-07 | unit | `pnpm vitest run tests/inventory/inventory.service.test.ts` | Wave 0 | ⬜ pending |
| 14-05-01 | 05 | 4 | INV-06 | manual | Admin UI visual check | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/inventory/inventory.service.test.ts` — stubs for INV-01 through INV-04, INV-06, INV-07, INV-08
- [ ] `tests/inventory/reservation.test.ts` — stubs for INV-05 atomic reservation
- [ ] `tests/fixtures/inventory.fixtures.ts` — mock warehouse, inventoryItem, stockMovement objects
- [ ] `tests/setup.ts` — add `warehouse`, `inventoryItem`, `stockMovement` to `prismaMock` using existing `vi.hoisted()` pattern

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin inventory dashboard renders stock levels | INV-06 | React component visual verification | Navigate to /dashboard/inventory, verify stock table renders |
| Admin warehouse management UI | INV-03 | React component visual verification | Create/edit/delete warehouse via admin UI |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
