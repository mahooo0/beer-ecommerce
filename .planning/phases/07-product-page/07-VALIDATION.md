---
phase: 07
slug: product-page
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (workspace root vitest.config.ts) |
| **Config file** | `/vitest.config.ts` (workspace root) |
| **Quick run command** | `pnpm vitest run tests/products/` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/products/`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | PDPG-01 | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | PDPG-02 | unit | `pnpm vitest run tests/products/variant-selector.test.ts` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 1 | PDPG-03 | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ W0 | ⬜ pending |
| 07-04-01 | 04 | 2 | PDPG-04 | unit | `pnpm vitest run tests/products/product-service-related.test.ts` | ❌ W0 | ⬜ pending |
| 07-05-01 | 05 | 2 | PDPG-05 | unit | `pnpm vitest run tests/products/product-service-fbt.test.ts` | ❌ W0 | ⬜ pending |
| 07-06-01 | 06 | 2 | PDPG-06 | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ W0 | ⬜ pending |
| 07-07-01 | 07 | 2 | PDPG-07 | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ W0 | ⬜ pending |
| 07-08-01 | 08 | 3 | PDPG-08 | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ W0 | ⬜ pending |
| 07-09-01 | 09 | 3 | PDPG-09 | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ W0 | ⬜ pending |
| 07-10-01 | 10 | 3 | PDPG-10 | unit | `pnpm vitest run tests/products/product-page.test.ts` | ❌ W0 | ⬜ pending |
| Related API | 04 | 2 | PDPG-04 | unit | `pnpm vitest run tests/products/product-service-related.test.ts` | ❌ W0 | ⬜ pending |
| FBT API | 05 | 2 | PDPG-05 | unit | `pnpm vitest run tests/products/product-service-fbt.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/products/product-page.test.ts` — stubs for PDPG-01, PDPG-03, PDPG-06, PDPG-07, PDPG-08, PDPG-09, PDPG-10
- [ ] `tests/products/variant-selector.test.ts` — stubs for PDPG-02 variant combination logic
- [ ] `tests/products/product-service-related.test.ts` — stubs for getRelated() server logic
- [ ] `tests/products/product-service-fbt.test.ts` — stubs for getFBT() server logic

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hover zoom visual effect | PDPG-01 | CSS-based visual behavior, hard to test programmatically | Hover over main image, verify magnified view appears |
| Fullscreen lightbox navigation | PDPG-01 | Requires real DOM interaction with overlay | Open lightbox, use arrow keys and swipe to navigate |
| Mobile swipe gallery | PDPG-01 | Touch event simulation is unreliable in unit tests | Swipe on mobile device, verify dot indicators update |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
