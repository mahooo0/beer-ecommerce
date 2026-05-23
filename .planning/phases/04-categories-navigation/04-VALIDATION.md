---
phase: 4
slug: categories-navigation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x (from Phase 3) |
| **Config file** | vitest.config.ts (exists from Phase 3) |
| **Quick run command** | `pnpm test --run --reporter=dot` |
| **Full suite command** | `pnpm test --run` |
| **Estimated runtime** | ~5 seconds |

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
| 04-00-01 | 00 | 1 | CAT-01..07 | stub | `pnpm test tests/categories/` | ❌ W0 | ⬜ pending |
| 04-01-01 | 01 | 1 | CAT-01 | integration | `pnpm test tests/categories/create.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | CAT-01 | integration | `pnpm test tests/categories/move.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | CAT-02 | integration | `pnpm test tests/categories/attributes.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 1 | CAT-03 | integration | `pnpm test tests/collections/crud.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 1 | CAT-03 | integration | `pnpm test tests/brands-tags/crud.test.ts` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | CAT-04 | integration | `pnpm test tests/navigation/mega-menu.test.ts` | ❌ W0 | ⬜ pending |
| 04-04-02 | 04 | 2 | CAT-05 | integration | `pnpm test tests/navigation/breadcrumbs.test.ts` | ❌ W0 | ⬜ pending |
| 04-05-01 | 05 | 2 | CAT-06 | integration | `pnpm test tests/categories/page.test.ts` | ❌ W0 | ⬜ pending |
| 04-05-02 | 05 | 2 | CAT-07 | integration | `pnpm test tests/categories/metadata.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/categories/create.test.ts` — stubs for CAT-01 (category creation with path calculation)
- [ ] `tests/categories/move.test.ts` — stubs for CAT-01 (tree operations, circular reference prevention)
- [ ] `tests/categories/attributes.test.ts` — stubs for CAT-02 (attribute CRUD and validation)
- [ ] `tests/collections/crud.test.ts` — stubs for CAT-03 (collection management)
- [ ] `tests/collections/products.test.ts` — stubs for CAT-03 (product-collection relations)
- [ ] `tests/brands-tags/crud.test.ts` — stubs for CAT-03 (brands and tags CRUD)
- [ ] `tests/navigation/mega-menu.test.ts` — stubs for CAT-04 (mega menu data fetching)
- [ ] `tests/navigation/breadcrumbs.test.ts` — stubs for CAT-05 (breadcrumb generation)
- [ ] `tests/categories/page.test.ts` — stubs for CAT-06 (category page with descendant products)
- [ ] `tests/categories/metadata.test.ts` — stubs for CAT-07 (SEO metadata generation)
- [ ] `tests/setup.ts` — extend with category/collection/brand/tag mocks

*Existing infrastructure from Phase 3 covers framework and config.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop tree reordering | CAT-01 | Visual interaction, drag events | Open admin /categories, drag category to new parent, verify path updates |
| Mega menu hover interaction | CAT-04 | CSS hover state, dropdown positioning | Hover over category in client nav, verify dropdown renders 2-3 levels |
| Breadcrumb visual rendering | CAT-05 | Layout, truncation, responsive | Navigate to deep category, check breadcrumb path on mobile + desktop |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
