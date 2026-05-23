---
phase: 3
slug: product-catalog
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-10
---

# Phase 3 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (created in Wave 0, plan 03-00) |
| **Quick run command** | `pnpm vitest run --reporter=verbose` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --reporter=verbose`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-00-01 | 00 | 0 | All | setup | `pnpm vitest run --reporter=verbose` | Wave 0 creates | ⬜ pending |
| 03-01-01 | 01 | 1 | PROD-01,02,03,04,05 | unit | `pnpm vitest run tests/products/simple.test.ts tests/products/variable.test.ts tests/products/weighted.test.ts tests/products/digital.test.ts tests/products/bundle.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | PROD-07 | unit | `pnpm vitest run tests/products/status.test.ts tests/products/listing.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | PROD-06 | unit | `pnpm vitest run tests/e2e/image-upload.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 2 | PROD-07 | tsc+test | `npx tsc --noEmit --project apps/admin/tsconfig.json && pnpm vitest run` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 2 | PROD-01-06 | tsc+test | `npx tsc --noEmit --project apps/admin/tsconfig.json && pnpm vitest run` | ❌ W0 | ⬜ pending |
| 03-05-01 | 05 | 2 | PROD-08,09 | unit | `pnpm vitest run tests/components/product-card.test.tsx tests/products/listing.test.ts` | ❌ W0 | ⬜ pending |
| 03-06-02 | 06 | 3 | PROD-10 | unit | `pnpm vitest run tests/products/csv-import.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending -- ✅ green -- ❌ red -- ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install vitest and testing dependencies (`pnpm add -D -w vitest @vitest/ui @testing-library/react @testing-library/jest-dom happy-dom`)
- [ ] Create `vitest.config.ts` with workspace aliases and coverage settings
- [ ] Create `tests/setup.ts` with Prisma mocks and product fixtures
- [ ] Create 10 placeholder test files with `.todo()` stubs
- [ ] Add `test`, `test:watch`, `test:coverage` scripts to root package.json

**Plan:** 03-00-PLAN.md (Wave 0)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Image upload drag-and-drop visual | PROD-06 | Requires browser interaction with Cloudinary widget | Upload image via CldUploadWidget, verify preview and reorder |
| CSV import with large file (1000+ rows) | PROD-10 | Requires actual file system and database | Import 1000-row CSV, verify all rows processed |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** compliant
