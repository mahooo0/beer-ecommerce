---
phase: 5
slug: search-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 (already installed at root) |
| **Config file** | `vitest.config.ts` (root — already exists) |
| **Quick run command** | `vitest run tests/search/ --reporter=verbose` |
| **Full suite command** | `vitest run --coverage` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `vitest run tests/search/ --reporter=verbose`
- **After every plan wave:** Run `vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-00-01 | 00 | 0 | Wave 0 infra | setup | `vitest run tests/search/ --reporter=verbose` | W0 creates | ⬜ pending |
| 05-01-01 | 01 | 1 | SRCH-01 | integration | `vitest run tests/search/sync.service.test.ts` | W0 creates | ⬜ pending |
| 05-01-02 | 01 | 1 | SRCH-01 | integration | `vitest run tests/search/sync.service.test.ts -t "full sync"` | W0 creates | ⬜ pending |
| 05-02-01 | 02 | 1 | SRCH-03, SRCH-04, SRCH-05 | integration | `vitest run tests/search/search.service.test.ts` | W0 creates | ⬜ pending |
| 05-02-02 | 02 | 1 | SRCH-06 | integration | `vitest run tests/search/search.controller.test.ts` | W0 creates | ⬜ pending |
| 05-03-01 | 03 | 2 | SRCH-02 | manual-only | Manual verification in browser | Manual | ⬜ pending |
| 05-03-02 | 03 | 2 | SRCH-06 | manual-only | Manual verification in browser | Manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/search/sync.service.test.ts` — stubs for SRCH-01 (sync on CRUD, batch sync)
- [ ] `tests/search/search.service.test.ts` — stubs for SRCH-03, SRCH-04, SRCH-05 (search fields, typo tolerance, facets)
- [ ] `tests/search/search.controller.test.ts` — stubs for SRCH-06 (admin settings: synonyms, stop words, ranking)
- [ ] `tests/fixtures/search.fixtures.ts` — shared fixtures for product search documents
- [ ] Mock Meilisearch client in test setup — prevents real Meilisearch calls in tests
- [x] `vitest.config.ts` — already exists at root level
- [x] Framework install — Vitest already installed (`vitest@^4.0.18` in root package.json)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Search results appear in <100ms | SRCH-02 | Requires real Meilisearch instance and browser timing | 1. Start Meilisearch via Docker Compose 2. Sync products 3. Open client app search 4. Type query and check Network tab for response time |
| SearchBox autocomplete renders correctly | SRCH-02 | Visual UI verification | 1. Open client app 2. Click search bar 3. Type partial query 4. Verify dropdown shows suggestions with product images |
| Admin search settings UI works | SRCH-06 | Visual form verification | 1. Open admin panel 2. Navigate to search settings 3. Add synonym pair 4. Verify synonym appears in list 5. Test search with synonym |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
