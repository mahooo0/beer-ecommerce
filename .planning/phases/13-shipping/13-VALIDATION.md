---
phase: 13
slug: shipping
status: active
nyquist_compliant: true
wave_0_complete: false
wave_0_plan: 13-00-PLAN.md
created: 2026-03-11
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (already installed at root) |
| **Config file** | `vitest.config.ts` (root — already exists) |
| **Quick run command** | `vitest run tests/shipping/ --reporter=verbose` |
| **Full suite command** | `vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `vitest run tests/shipping/ --reporter=verbose`
- **After every plan wave:** Run `vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-00-01 | 00 | 0 | Wave 0 infra | setup | `vitest run tests/products/simple.test.ts --reporter=verbose` | vitest.config.ts exists | ⬜ pending |
| 13-00-02 | 00 | 0 | Wave 0 stubs | setup | `vitest run tests/shipping/ --reporter=verbose` | W0 creates | ⬜ pending |
| 13-01-01 | 01 | 1 | SHIP-01 | integration | `vitest run tests/shipping/shipping-service.test.ts -t "zone creation"` | W0 creates | ⬜ pending |
| 13-01-02 | 01 | 1 | SHIP-02 | integration | `vitest run tests/shipping/shipping-service.test.ts -t "method creation"` | W0 creates | ⬜ pending |
| 13-01-03 | 01 | 1 | SHIP-03 | unit | `vitest run tests/shipping/shipping-service.test.ts -t "rate calculation"` | W0 creates | ⬜ pending |
| 13-01-04 | 01 | 1 | SHIP-06 | unit | `vitest run tests/shipping/shipping-service.test.ts -t "free shipping threshold"` | W0 creates | ⬜ pending |
| 13-02-01 | 02 | 1 | SHIP-04 | integration | `vitest run tests/shipping/order-tracking.test.ts -t "add tracking"` | W0 creates | ⬜ pending |
| 13-04-01 | 04 | 2 | SHIP-05 | manual-only | Manual verification in browser | Manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Covered by **13-00-PLAN.md** (Wave 0):

- [ ] `tests/setup.ts` — extended with shippingZone and shippingMethod Prisma mocks
- [ ] `tests/shipping/shipping-service.test.ts` — stubs for SHIP-01, SHIP-02, SHIP-03, SHIP-06
- [ ] `tests/shipping/order-tracking.test.ts` — stubs for SHIP-04
- [ ] `tests/fixtures/shipping.fixtures.ts` — shared fixtures for zones, methods, addresses
- [x] `vitest.config.ts` — already exists at root level
- [x] Framework install — Vitest already installed (`vitest@^4.0.18` in root package.json)

---

## SHIP-03 Scope Clarification

SHIP-03 ("Shipping rate calculated at checkout") is fully covered by Phase 13's API:
- **Phase 13 provides:** POST /api/shipping/calculate endpoint (Plan 13-01, Task 2)
- **Phase 10 consumes:** Checkout shipping step UI calls this endpoint (Phase 10 depends on Phase 13 in ROADMAP)

The "at checkout" UI component is Phase 10's responsibility (CHKT-03). Phase 13 provides the complete API foundation.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Customer views tracking info with carrier URL | SHIP-05 | Requires visual verification of tracking section rendering, external link behavior | 1. Create order with tracking number 2. Navigate to order detail page 3. Verify carrier name, tracking number, and "Track Package" link display 4. Click link to verify it opens correct carrier tracking page |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (13-00-PLAN.md created)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (revision pass)
