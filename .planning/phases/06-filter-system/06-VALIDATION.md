---
phase: 6
slug: filter-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x (from Phase 3) |
| **Config file** | vitest.config.ts (exists from Phase 3) |
| **Quick run command** | `pnpm test --run --reporter=dot` |
| **Full suite command** | `pnpm test --run` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --run --reporter=dot`
- **After every plan wave:** Run `pnpm test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-00-01 | 00 | 1 | FILT-01..07 | stub | `pnpm test tests/filters/` | ❌ W0 | ⬜ pending |
| 06-01-01 | 01 | 1 | FILT-01,05 | integration | `pnpm test tests/filters/filter-service.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | FILT-03,07 | integration | `pnpm test tests/filters/facet-counts.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | FILT-01,03 | unit | `pnpm test tests/filters/attribute-filter.test.tsx` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | FILT-02 | unit | `pnpm test tests/filters/price-filter.test.tsx` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | FILT-04 | unit | `pnpm test tests/filters/use-filters.test.tsx` | ❌ W0 | ⬜ pending |
| 06-03-02 | 03 | 2 | FILT-06 | unit | `pnpm test tests/filters/filter-drawer.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/filters/filter-service.test.ts` — stubs for FILT-01, FILT-05 (server-side filtering with OR/AND logic)
- [ ] `tests/filters/facet-counts.test.ts` — stubs for FILT-03, FILT-07 (facet count aggregation, availability)
- [ ] `tests/filters/attribute-filter.test.tsx` — stubs for FILT-01, FILT-03 (dynamic filter rendering)
- [ ] `tests/filters/price-filter.test.tsx` — stubs for FILT-02 (price range slider + inputs)
- [ ] `tests/filters/filter-drawer.test.tsx` — stubs for FILT-06 (mobile drawer open/close/apply)
- [ ] `tests/filters/use-filters.test.tsx` — stubs for FILT-04 (URL state persistence with nuqs)
- [ ] `tests/filters/availability-filter.test.tsx` — stubs for FILT-07 (availability options)
- [ ] `tests/setup.ts` — extend with nuqs mock for browser-less tests

*Existing infrastructure from Phase 3/4 covers framework and config.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Price slider drag UX | FILT-02 | Drag interaction, debounce feel | Drag slider, check URL updates after 300ms delay |
| Mobile drawer animation | FILT-06 | CSS transitions, touch gestures | Open filter drawer on mobile, verify slide-in animation |
| Filter URL sharing | FILT-04 | Browser URL bar copy/paste | Apply filters, copy URL, paste in incognito, verify same view |
| Facet count accuracy | FILT-03 | Requires seeded test data | Seed products, apply filters, verify counts match actual results |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
