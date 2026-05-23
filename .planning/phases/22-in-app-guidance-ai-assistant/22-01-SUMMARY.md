---
phase: 22
plan: 01
subsystem: ai-assistant
tags: [ai-sdk, streaming, rate-limiting, chat-widget, next-js-api-route]
dependency_graph:
  requires:
    - 22-00 (AI SDK packages installed)
  provides:
    - POST /api/chat endpoint with streaming AI responses and rate limiting
    - Floating chat widget with drawer UI
  affects:
    - apps/client/src/app/api/chat/route.ts
    - apps/client/src/components/ai-assistant/ChatWidget.tsx
    - apps/client/src/components/ai-assistant/ChatMessages.tsx
    - apps/client/src/components/ai-assistant/ChatInput.tsx
tech_stack:
  added: []
  patterns:
    - Vercel AI SDK streamText + toUIMessageStreamResponse for streaming chat
    - useChat from @ai-sdk/react for client-side streaming state management
    - IP-based in-memory rate limiter with sliding window per process
    - Dynamic system prompt construction from optional page context
key_files:
  created:
    - apps/client/src/app/api/chat/route.ts
    - apps/client/src/components/ai-assistant/ChatWidget.tsx
    - apps/client/src/components/ai-assistant/ChatMessages.tsx
    - apps/client/src/components/ai-assistant/ChatInput.tsx
    - apps/client/.env.example
  modified: []
decisions:
  - "Rate limiter uses module-level Map (in-memory, per-process) — appropriate for single-process dev and Vercel single-instance functions; for multi-instance production a Redis-backed limiter would be needed"
  - "ChatWidget maps useChat messages to explicit parts array for ChatMessages compatibility — handles AI SDK UIMessage part shape"
metrics:
  duration: 81s
  completed: "2026-03-12"
  tasks_completed: 2
  files_created: 5
  files_modified: 0
---

# Phase 22 Plan 01: Client AI Chat API Route and Widget Summary

**One-liner:** Next.js App Router POST /api/chat with Vercel AI SDK streamText (gpt-4o-mini), IP-based rate limiting (10 req/min), and a floating ChatWidget using useChat with message rendering and auto-scroll.

## What Was Built

### Task 1: Client AI Chat API Route

`apps/client/src/app/api/chat/route.ts` provides:

- **Rate limiter** — module-level `Map<string, { count, resetAt }>` with `checkRateLimit(ip)`. Allows 10 requests per 60-second window per IP. Returns `429` with plain text body when exceeded.
- **POST handler** — extracts IP from `x-forwarded-for`, calls `checkRateLimit`, parses `{ messages, context }` from request body, builds a dynamic system prompt (page, product name, category, store policies), calls `streamText` with `openai('gpt-4o-mini')` and `maxTokens: 500`, returns `result.toUIMessageStreamResponse()`.
- **`maxDuration = 30`** — exported for Vercel serverless function timeout.

### Task 2: Client AI Chat Widget Components

Three `'use client'` components in `apps/client/src/components/ai-assistant/`:

| Component | Purpose |
|-----------|---------|
| `ChatInput.tsx` | Form with text input and Send button, disables during loading |
| `ChatMessages.tsx` | Message list rendering user (blue, right) and assistant (gray, left) bubbles; auto-scrolls; shows "Thinking..." during streaming; welcome message when empty |
| `ChatWidget.tsx` | Fixed floating button (bottom-4 right-4) toggles a `h-[28rem] w-80 sm:w-96` panel. Uses `useChat({ api: '/api/chat' })` from `@ai-sdk/react`, derives `isLoading` from `status === 'submitted' || status === 'streaming'` |

## Decisions Made

- **In-memory rate limiter** — module-level Map is correct for single-process Next.js in dev and Vercel's single-function-per-invocation model. For multi-region/multi-instance production use, Redis (Upstash) would be needed. Noted in `.env.example` pattern.
- **Message parts mapping in ChatWidget** — `useChat` returns messages with typed parts; mapped to `{ type, text }` shape expected by `ChatMessages` to avoid prop drilling complex AI SDK types into leaf components.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

```
test -f apps/client/src/app/api/chat/route.ts
  -> grep "streamText" ✓
  -> grep "maxDuration" ✓
  -> grep "checkRateLimit" ✓

test -f apps/client/src/components/ai-assistant/ChatWidget.tsx
  -> grep "useChat" ✓
test -f apps/client/src/components/ai-assistant/ChatMessages.tsx ✓
test -f apps/client/src/components/ai-assistant/ChatInput.tsx ✓
```

## Self-Check

- [x] `apps/client/src/app/api/chat/route.ts` — created (exports POST, maxDuration, checkRateLimit)
- [x] `apps/client/src/components/ai-assistant/ChatWidget.tsx` — created (useChat, floating button, drawer)
- [x] `apps/client/src/components/ai-assistant/ChatMessages.tsx` — created ('use client', auto-scroll, streaming indicator)
- [x] `apps/client/src/components/ai-assistant/ChatInput.tsx` — created ('use client', form, loading state)
- [x] `apps/client/.env.example` — created (OPENAI_API_KEY)
- [x] Commit 9fa27bf — feat(22-01): add client AI chat API route with IP-based rate limiting
- [x] Commit c908ff8 — feat(22-01): add floating ChatWidget with ChatMessages and ChatInput components

## Self-Check: PASSED
