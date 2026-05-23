---
phase: 2
slug: authentication-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `vitest run --bail=1` |
| **Full suite command** | `vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `vitest run --bail=1`
- **After every plan wave:** Run `vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-01 | integration | `vitest tests/webhooks/clerk.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-01 | unit | `vitest tests/webhooks/signature.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | AUTH-02 | e2e | Manual - browser test | ❌ Manual | ⬜ pending |
| 02-03-01 | 03 | 1 | AUTH-03 | e2e | Manual - browser test | ❌ Manual | ⬜ pending |
| 02-04-01 | 04 | 1 | AUTH-04 | e2e | Manual - browser test | ❌ Manual | ⬜ pending |
| 02-05-01 | 05 | 1 | AUTH-05 | integration | `vitest tests/middleware/admin-access.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-06-01 | 06 | 1 | AUTH-06 | unit | `vitest tests/middleware/express-auth.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-07-01 | 07 | 2 | AUTH-07 | integration | `vitest tests/actions/profile.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-08-01 | 08 | 2 | AUTH-08 | integration | `vitest tests/actions/addresses.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-09-01 | 09 | 2 | AUTH-09 | integration | `vitest tests/actions/admin-users.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` (workspace root) — Configure Vitest for monorepo with @clerk/testing
- [ ] `apps/client/tests/setup.ts` — Mock Clerk context for client tests
- [ ] `apps/admin/tests/setup.ts` — Mock Clerk context for admin tests
- [ ] `apps/server/tests/setup.ts` — Mock Clerk middleware for server tests
- [ ] `tests/webhooks/clerk.test.ts` — Webhook event handling test stubs
- [ ] `tests/middleware/admin-access.test.ts` — Role-based access control test stubs
- [ ] `tests/actions/profile.test.ts` — User profile update test stubs
- [ ] `tests/actions/addresses.test.ts` — Address CRUD test stubs
- [ ] `tests/actions/admin-users.test.ts` — Admin user management test stubs
- [ ] Framework install: `pnpm add -D vitest @vitest/ui @clerk/testing` — No test framework detected

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| User registers with email/password | AUTH-02 | Requires Clerk-hosted UI interaction | 1. Go to /sign-up 2. Fill email/password 3. Verify account created in DB |
| User logs in with Google OAuth | AUTH-03 | OAuth flow requires real browser + provider | 1. Go to /sign-in 2. Click Google 3. Complete OAuth 4. Verify session |
| User logs in with GitHub OAuth | AUTH-03 | OAuth flow requires real browser + provider | 1. Go to /sign-in 2. Click GitHub 3. Complete OAuth 4. Verify session |
| Session persists after refresh | AUTH-04 | Requires real browser cookie behavior | 1. Login 2. Refresh page 3. Verify still logged in |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
