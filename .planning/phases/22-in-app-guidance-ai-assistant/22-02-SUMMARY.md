---
phase: 22
plan: 02
subsystem: ai-assistant
tags: [ai-sdk, admin, chat-widget, streaming, rate-limiting, wave-2]
dependency_graph:
  requires:
    - 22-00 (AI SDK packages installed in admin app)
  provides:
    - Admin AI chat API route (POST /api/chat with admin system prompt)
    - AdminChatWidget floating help button and chat panel
    - AdminChatMessages message list with auto-scroll
    - AdminChatInput form with send button
  affects:
    - apps/admin/src/app/api/chat/route.ts
    - apps/admin/src/components/ai-assistant/
tech_stack:
  added: []
  patterns:
    - streamText with convertToModelMessages for Vercel AI SDK streaming
    - IP-based Map rate limiter (10 req/60s) matching client route pattern
    - useChat hook wired to /api/chat for streaming chat UI
    - Indigo color scheme to differentiate admin widget from client blue
key_files:
  created:
    - apps/admin/src/app/api/chat/route.ts
    - apps/admin/src/components/ai-assistant/AdminChatWidget.tsx
    - apps/admin/src/components/ai-assistant/AdminChatMessages.tsx
    - apps/admin/src/components/ai-assistant/AdminChatInput.tsx
  modified: []
decisions:
  - "Admin widget uses indigo color scheme (vs client blue) to visually differentiate admin vs storefront contexts"
  - "context.page passed as optional body param to route for page-aware system prompt responses"
metrics:
  duration: 101s
  completed: "2026-03-12"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 22 Plan 02: Admin AI Assistant Summary

**One-liner:** Admin AI chat API route with admin-specific system prompt (products/shipping/inventory/users), IP rate limiting, and indigo-styled floating chat widget using Vercel AI SDK useChat hook.

## What Was Built

### Task 1: Admin AI Chat API Route

`apps/admin/src/app/api/chat/route.ts` provides a streaming AI chat endpoint for the admin panel:

- **Rate limiter:** IP-based Map pattern (10 requests per 60-second window), returns 429 on block
- **System prompt:** Admin-focused — covers product types (simple, variable, weighted, digital, bundled), categories, shipping zones, inventory warehouses, search settings, user roles, and navigation
- **Context-aware:** Accepts optional `context.page` to inject current admin page into the system prompt
- **Streaming:** `streamText` with `openai('gpt-4o-mini')`, `convertToModelMessages`, `maxTokens: 500`, `maxDuration: 30`

### Task 2: Admin Chat Widget Components

Three `'use client'` components in `apps/admin/src/components/ai-assistant/`:

| Component | Role |
|-----------|------|
| `AdminChatInput` | Form with "Ask about admin features..." placeholder, disabled during loading |
| `AdminChatMessages` | Auto-scroll message list, welcome message, indigo user bubbles / gray assistant bubbles |
| `AdminChatWidget` | Fixed ? button (bottom-4 right-4, indigo), indigo-header panel (bottom-20 right-4, w-80/sm:w-96, h-[28rem]), useChat wired to /api/chat |

`isLoading` derived from `status === 'submitted' || status === 'streaming'`.

## Decisions Made

- **Indigo color scheme:** Admin widget uses indigo (vs client app blue) to give admins a clear visual distinction between the two interfaces
- **context.page optional body param:** Route accepts `{ messages, context?: { page? } }` so admin pages can inject page context for more targeted responses — not required, defaults to 'dashboard'

## Deviations from Plan

None - plan executed exactly as written.

## Verification

All success criteria met:
- POST /api/chat in admin app exports streamText with admin-specific system prompt
- AdminChatWidget uses useChat connected to /api/chat
- All three components have 'use client' directive
- Rate limiting active (10 req/60s window, 429 on block)
- Indigo styling differentiates admin widget from client widget

## Self-Check: PASSED

- [x] `apps/admin/src/app/api/chat/route.ts` — created
- [x] `apps/admin/src/components/ai-assistant/AdminChatWidget.tsx` — created
- [x] `apps/admin/src/components/ai-assistant/AdminChatMessages.tsx` — created
- [x] `apps/admin/src/components/ai-assistant/AdminChatInput.tsx` — created
- [x] Commit 5e99d42 — feat(22-02): create admin AI chat API route
- [x] Commit 6642f1c — feat(22-02): create admin chat widget components
