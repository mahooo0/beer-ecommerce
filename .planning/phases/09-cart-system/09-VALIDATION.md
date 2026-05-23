---
phase: 9
slug: cart-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (workspace root) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/cart/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/cart/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-00-01 | 00 | 0 | CART-01 | unit | `npx vitest run tests/cart/cart-service.test.ts` | ❌ W0 | ⬜ pending |
| 09-00-02 | 00 | 0 | CART-02 | unit | `npx vitest run tests/cart/cart-store.test.ts` | ❌ W0 | ⬜ pending |
| 09-00-03 | 00 | 0 | CART-07 | unit | `npx vitest run tests/cart/coupon-validation.test.ts` | ❌ W0 | ⬜ pending |
| 09-00-04 | 00 | 0 | CART-08 | unit | `npx vitest run tests/cart/stock-validation.test.ts` | ❌ W0 | ⬜ pending |
| 09-00-05 | 00 | 0 | CART-09 | unit | `npx vitest run tests/cart/mini-cart-drawer.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/cart/cart-service.test.ts` — stubs for CART-01, CART-03, CART-05
- [ ] `tests/cart/cart-store.test.ts` — stubs for CART-02, CART-04, CART-06
- [ ] `tests/cart/coupon-validation.test.ts` — stubs for CART-07
- [ ] `tests/cart/stock-validation.test.ts` — stubs for CART-08
- [ ] `tests/cart/mini-cart-drawer.test.ts` — stubs for CART-09
- [ ] Add `coupon` mock to `tests/setup.ts` prismaMock

*Existing infrastructure covers framework installation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mini cart slide-out animation | CART-09 | Visual/interaction quality | Open mini cart, verify smooth slide animation, backdrop dim |
| Cart persistence across browser restart | CART-04 | Requires browser restart | Add items, close browser, reopen, verify cart intact |
| Cart merge on login | CART-03 | E2E flow with auth | Add items as guest, log in, verify both carts merged |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
