---
phase: 22
plan: 00
subsystem: ai-assistant
tags: [ai-sdk, driver.js, test-stubs, wave-0, dependencies]
dependency_graph:
  requires: []
  provides:
    - ai SDK packages in client and admin apps
    - Wave 0 test stubs for all Phase 22 behaviors
  affects:
    - apps/client/package.json
    - apps/admin/package.json
    - tests/ai-assistant/
tech_stack:
  added:
    - ai@^6.0.116 (Vercel AI SDK core — streamText, convertToModelMessages)
    - "@ai-sdk/react@^3.0.118 (useChat hook for client components)"
    - "@ai-sdk/openai@^3.0.41 (OpenAI provider adapter)"
    - driver.js@^1.4.0 (MIT feature tour library)
  patterns:
    - it.todo() stub pattern for Wave 0 test infrastructure (established Phase 03-00)
    - Workspace-root tests/ directory for all vitest stubs
key_files:
  created:
    - tests/ai-assistant/chat.test.ts
    - tests/ai-assistant/chat-rate-limit.test.ts
    - tests/ai-assistant/chat-widget.test.tsx
    - tests/ai-assistant/help-tooltip.test.tsx
    - tests/ai-assistant/admin-chat.test.ts
    - tests/ai-assistant/admin-chat-widget.test.tsx
  modified:
    - apps/client/package.json (added 4 AI/guidance dependencies)
    - apps/admin/package.json (added 4 AI/guidance dependencies)
decisions:
  - "Place Phase 22 test stubs in tests/ai-assistant/ (workspace root) to match established project test convention — plan specified apps/client/src/__tests__/ but vitest.config.ts only scans tests/**"
metrics:
  duration: 116s
  completed: "2026-03-12"
  tasks_completed: 2
  files_created: 6
  files_modified: 2
---

# Phase 22 Plan 00: AI Assistant Test Infrastructure Summary

**One-liner:** Installed Vercel AI SDK (ai, @ai-sdk/react, @ai-sdk/openai) and Driver.js in both client and admin apps, and created 6 Wave 0 test stub files with 24 it.todo() stubs covering all Phase 22 testable behaviors.

## What Was Built

### Task 1: Packages Installed
All four packages installed in both `apps/client` and `apps/admin`:
- `ai@6.0.116` — Vercel AI SDK core (streamText, convertToModelMessages, UIMessage)
- `@ai-sdk/react@3.0.118` — useChat hook for streaming chat UI
- `@ai-sdk/openai@3.0.41` — OpenAI provider (gpt-4o-mini)
- `driver.js@1.4.0` — MIT product tour library (framework-agnostic)

### Task 2: Test Stubs Created
6 files in `tests/ai-assistant/` with 24 total `it.todo()` stubs:

| File | Stubs | Covers |
|------|-------|--------|
| `chat.test.ts` | 5 | Client /api/chat route handler |
| `chat-rate-limit.test.ts` | 4 | IP-based rate limiter utility |
| `chat-widget.test.tsx` | 5 | ChatWidget floating button + drawer |
| `help-tooltip.test.tsx` | 4 | HelpTooltip ? icon component |
| `admin-chat.test.ts` | 3 | Admin /api/chat route handler |
| `admin-chat-widget.test.tsx` | 3 | AdminChatWidget help panel |

All 6 files collected and run by Vitest without errors (24 skipped/todo, 0 failures).

## Decisions Made

- **Test file placement:** Placed stubs in `tests/ai-assistant/` (workspace root) instead of `apps/client/src/__tests__/` as specified in the plan. The project's vitest.config.ts uses `include: ['tests/**/*.test.{ts,tsx}']` — files in `apps/*/src/__tests__/` would not be collected. Following the established convention from Phases 03, 06, 08, 13, 14.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected test file paths to match vitest include pattern**
- **Found during:** Task 2
- **Issue:** Plan specified test files in `apps/client/src/__tests__/` and `apps/admin/src/__tests__/` but vitest.config.ts `include` pattern is `tests/**/*.test.{ts,tsx}` — files in app subdirectories are not scanned
- **Fix:** Created all 6 stub files in `tests/ai-assistant/` to match the workspace-root `tests/` convention used by all previous phases
- **Files modified:** N/A (files created in correct location)

## Verification

```
pnpm vitest run tests/ai-assistant/
  6 test files skipped (24 todo tests)
  0 failures
```

## Self-Check

- [x] `tests/ai-assistant/chat.test.ts` — created
- [x] `tests/ai-assistant/chat-rate-limit.test.ts` — created
- [x] `tests/ai-assistant/chat-widget.test.tsx` — created
- [x] `tests/ai-assistant/help-tooltip.test.tsx` — created
- [x] `tests/ai-assistant/admin-chat.test.ts` — created
- [x] `tests/ai-assistant/admin-chat-widget.test.tsx` — created
- [x] `apps/client/package.json` has ai, @ai-sdk/react, @ai-sdk/openai, driver.js
- [x] `apps/admin/package.json` has ai, @ai-sdk/react, @ai-sdk/openai, driver.js
- [x] Commit a7db98d — chore(22-00): install AI SDK and Driver.js packages
- [x] Commit 31c96bb — test(22-00): add Wave 0 test stubs for all Phase 22 testable behaviors

## Self-Check: PASSED
