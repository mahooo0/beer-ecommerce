---
phase: 22
slug: in-app-guidance-ai-assistant
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | vitest.config.ts (workspace root) |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test:coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | AI chat route | integration | `pnpm vitest run apps/client/src/__tests__/api/chat.test.ts` | ❌ W0 | ⬜ pending |
| 22-01-02 | 01 | 1 | useChat renders | unit | `pnpm vitest run apps/client/src/__tests__/components/ChatWidget.test.tsx` | ❌ W0 | ⬜ pending |
| 22-01-03 | 01 | 1 | Rate limiter | unit | `pnpm vitest run apps/client/src/__tests__/api/chat-rate-limit.test.ts` | ❌ W0 | ⬜ pending |
| 22-02-01 | 02 | 1 | Admin chat route | integration | `pnpm vitest run apps/admin/src/__tests__/api/chat.test.ts` | ❌ W0 | ⬜ pending |
| 22-02-02 | 02 | 1 | Admin chat widget | unit | `pnpm vitest run apps/admin/src/__tests__/components/AdminChatWidget.test.tsx` | ❌ W0 | ⬜ pending |
| 22-03-01 | 03 | 2 | HelpTooltip | unit | `pnpm vitest run apps/client/src/__tests__/components/HelpTooltip.test.tsx` | ❌ W0 | ⬜ pending |
| 22-04-01 | 04 | 2 | Driver.js tour | manual-only | N/A — DOM tour requires browser | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/client/src/__tests__/api/chat.test.ts` — mock `streamText`, test POST handler
- [ ] `apps/client/src/__tests__/components/ChatWidget.test.tsx` — mock `useChat`, test render
- [ ] `apps/client/src/__tests__/api/chat-rate-limit.test.ts` — rate limiter unit tests
- [ ] `apps/admin/src/__tests__/api/chat.test.ts` — admin chat route tests
- [ ] `apps/admin/src/__tests__/components/AdminChatWidget.test.tsx` — admin assistant render
- [ ] `apps/client/src/__tests__/components/HelpTooltip.test.tsx` — tooltip render tests
- [ ] Mock setup for `ai` package in vitest setup

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Driver.js tour starts and highlights elements | In-app guidance | Driver.js requires real DOM with positioned elements | 1. Open client app 2. Trigger tour 3. Verify overlay + popover appears on each step |
| Chat widget opens/closes smoothly | AI assistant UI | Visual/animation quality | 1. Click chat FAB 2. Verify drawer opens 3. Send message 4. Verify streaming response |
| Tour persistence across sessions | Guidance UX | Requires localStorage state | 1. Complete tour 2. Refresh page 3. Verify tour does not auto-start |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
