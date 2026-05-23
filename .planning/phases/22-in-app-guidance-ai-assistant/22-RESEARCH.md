# Phase 22: In-App Guidance & AI Assistant - Research

**Researched:** 2026-03-11
**Domain:** AI chatbot integration (Vercel AI SDK), in-app product tours (Driver.js), contextual help system
**Confidence:** HIGH (AI SDK), HIGH (Driver.js), MEDIUM (contextual help tooltips)

---

## Summary

Phase 22 adds two distinct but complementary features to the e-commerce template: (1) an AI-powered shopping assistant chatbot for the client storefront and an AI-powered admin helper for the admin panel, and (2) an in-app guidance system with product tours and contextual help tooltips.

The AI assistant uses the Vercel AI SDK (packages `ai` and `@ai-sdk/react`) for streaming chat, wired to an LLM provider (OpenAI `@ai-sdk/openai` or Anthropic `@ai-sdk/anthropic`). The client assistant is an e-commerce shopping assistant — it understands the product catalog, can answer questions about products, shipping, and orders. The admin assistant helps with how-to guidance for the admin panel. Both use `useChat` on the frontend with a `/api/chat` route handler using `streamText`.

The in-app guidance system uses Driver.js (MIT license, 25K+ stars) for feature tours on both the client onboarding flow and the admin panel. Driver.js is framework-agnostic and integrates cleanly into Next.js App Router client components via `"use client"` + `useEffect`. Contextual help tooltips (the `?` icon with popover pattern) are custom-built with Tailwind CSS — no library needed.

**Primary recommendation:** Use Vercel AI SDK 6.x (`ai` + `@ai-sdk/react`) for streaming chat, Driver.js for tours, and custom Tailwind tooltips for inline help. Do NOT build custom streaming infrastructure.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | ^4.x / 6.x | AI SDK Core — streamText, generateText, tool calling | Vercel's official AI toolkit, unified provider API |
| `@ai-sdk/react` | ^1.x | useChat hook, UI state management | Official React bindings, auto-handles SSE streaming |
| `@ai-sdk/openai` | latest | OpenAI provider (GPT-4o-mini for cost) | Most widely used, good for e-commerce tasks |
| `driver.js` | latest (MIT) | Feature tours, element highlighting | Lightweight, MIT license, framework-agnostic, 25K stars |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@ai-sdk/anthropic` | latest | Anthropic provider (Claude Haiku) | Alternative provider, swap if preferred |
| `express-rate-limit` | ^7.x | Rate limit AI chat API endpoint | Already available, prevent AI API cost abuse |
| `zod` | ^3.25.0 | AI tool call schema validation | Already in stack, enforces structured LLM output |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Driver.js | React Joyride | React Joyride requires React bindings, more complex; Driver.js is simpler MIT |
| Driver.js | Shepherd.js | Shepherd is AGPL (needs commercial license for proprietary use) |
| Driver.js | Onborda | Onborda is Next.js-specific and newer (less battle-tested) |
| Custom tooltips | Radix UI Tooltip | Radix requires install; project avoids shadcn/radix, custom Tailwind is established pattern |
| `@ai-sdk/openai` | direct OpenAI SDK | Vercel AI SDK adds streaming, type-safety, provider-swap portability |

**Installation:**
```bash
# In apps/client (shopping assistant)
pnpm --filter client add ai @ai-sdk/react @ai-sdk/openai driver.js

# In apps/admin (admin assistant + admin tours)
pnpm --filter admin add ai @ai-sdk/react @ai-sdk/openai driver.js

# In apps/server (AI chat API route is a Next.js API route, not Express)
# No server package changes needed for AI routes (Next.js handles them)
```

**Note:** The AI chat API route lives inside `apps/client/app/api/chat/route.ts` and `apps/admin/app/api/chat/route.ts` — Next.js App Router route handlers, NOT the Express server. The Express server (`apps/server`) is the product/order API; it is not involved in the AI streaming.

---

## Architecture Patterns

### Recommended Project Structure
```
apps/client/src/
├── components/
│   ├── ai-assistant/
│   │   ├── ChatWidget.tsx          # Floating chat button + drawer
│   │   ├── ChatMessages.tsx        # Message list with streaming parts
│   │   ├── ChatInput.tsx           # Input form with send button
│   │   └── ChatMessage.tsx         # Individual message bubble
│   └── guidance/
│       ├── TourProvider.tsx        # Driver.js tour context + hooks
│       ├── HelpTooltip.tsx         # Inline ? tooltip component
│       └── tours/
│           ├── homepageTour.ts     # Step definitions for homepage
│           └── productTour.ts     # Step definitions for product page
├── app/
│   └── api/
│       └── chat/
│           └── route.ts            # streamText handler (client AI)

apps/admin/src/
├── components/
│   ├── ai-assistant/
│   │   ├── AdminChatWidget.tsx     # Admin AI helper widget
│   │   └── ...
│   └── guidance/
│       ├── HelpTooltip.tsx         # Admin contextual help
│       └── tours/
│           ├── dashboardTour.ts    # Admin dashboard tour steps
│           └── productCreateTour.ts
├── app/
│   └── api/
│       └── chat/
│           └── route.ts            # streamText handler (admin AI)
```

### Pattern 1: Streaming Chat with useChat
**What:** Client component uses `useChat` hook; API route uses `streamText` with system prompt containing store context
**When to use:** Every AI chat interaction — shopping assistant, admin helper

```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
// apps/client/app/api/chat/route.ts
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `You are a helpful shopping assistant for an e-commerce store.
Help customers find products, answer questions about shipping and returns,
and guide them through their shopping experience. Be concise and friendly.`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
// apps/client/src/components/ai-assistant/ChatWidget.tsx
'use client';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
  });

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(!open)}>AI Assistant</button>
      {open && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-white shadow-xl rounded-lg flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map(msg => (
              <div key={msg.id} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                {msg.parts.map((part, i) =>
                  part.type === 'text' ? <p key={i}>{part.text}</p> : null
                )}
              </div>
            ))}
            {status === 'streaming' && <p className="text-gray-400">Thinking...</p>}
          </div>
          <form onSubmit={e => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            sendMessage({ text: fd.get('input') as string });
            e.currentTarget.reset();
          }} className="p-2 border-t">
            <input name="input" placeholder="Ask me anything..." className="w-full border rounded p-2" />
          </form>
        </div>
      )}
    </>
  );
}
```

### Pattern 2: Driver.js Tour in Next.js App Router
**What:** Client component with `"use client"` uses Driver.js inside `useEffect` — only runs client-side
**When to use:** First-time user onboarding tours, feature discovery tours

```typescript
// Source: https://driverjs.com/docs/installation + DEV community verified example
// apps/client/src/components/guidance/TourProvider.tsx
'use client';
import { useEffect, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function useHomepageTour() {
  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      overlayClickBehavior: 'nextStep',
      showButtons: ['previous', 'next', 'close'],
      doneBtnText: 'Got it!',
      steps: [
        {
          element: '#search-bar',
          popover: {
            title: 'Search Products',
            description: 'Search for any product by name, brand, or category.',
            side: 'bottom',
          },
        },
        {
          element: '#mega-menu',
          popover: {
            title: 'Browse Categories',
            description: 'Explore our full catalog by category.',
            side: 'bottom',
          },
        },
        {
          element: '#cart-icon',
          popover: {
            title: 'Your Cart',
            description: 'Your selected items appear here.',
            side: 'bottom',
          },
        },
      ],
    });
    driverObj.drive();
  }, []);

  return { startTour };
}
```

### Pattern 3: Contextual Help Tooltip (Custom, No Library)
**What:** Small `?` icon that shows a popover on hover/click — built with Tailwind CSS and React state
**When to use:** Inline help for form fields, admin settings explanations

```typescript
// Custom component — no external library (matches project's Tailwind v4 pattern)
// apps/admin/src/components/guidance/HelpTooltip.tsx
'use client';
import { useState } from 'react';

interface HelpTooltipProps {
  content: string;
}

export function HelpTooltip({ content }: HelpTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center hover:bg-gray-300"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
      >
        ?
      </button>
      {visible && (
        <div className="absolute z-50 bottom-6 left-1/2 -translate-x-1/2 w-48 bg-gray-900 text-white text-xs rounded p-2 shadow-lg">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
```

### Pattern 4: System Prompt with E-Commerce Context Injection
**What:** Dynamic system prompt that injects relevant store context (store name, policies, current page context)
**When to use:** All AI chat routes — enriches assistant quality without RAG setup

```typescript
// Dynamic context injection into system prompt
// apps/client/app/api/chat/route.ts (extended pattern)
export async function POST(req: Request) {
  const { messages, context } = await req.json();
  // context: { page: 'product', productName: 'Blue Sneakers', category: 'Footwear' }

  const systemPrompt = `You are a helpful shopping assistant.
Store: [Store Name].
Current page: ${context?.page ?? 'homepage'}.
${context?.productName ? `User is viewing: "${context.productName}" in ${context.category}.` : ''}
Policies: Free shipping over $50. 30-day returns.
Help users find products, answer questions about orders, shipping, and returns.
Keep responses concise (2-3 sentences max). If asked about specific inventory or pricing,
say you'll connect them with support for accurate real-time data.`;

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxTokens: 500,
  });

  return result.toUIMessageStreamResponse();
}
```

### Anti-Patterns to Avoid
- **Sending all product catalog to LLM context:** Token costs explode. Use system prompt with store summary + let users ask specific questions. RAG is v2 scope.
- **Using AI route on Express server:** AI streaming belongs in Next.js route handlers (`app/api/chat/route.ts`), not the Express server. Express handles product/order APIs.
- **Triggering Driver.js outside useEffect:** Driver.js is DOM-imperative; calling it during SSR or render causes errors. Always call `driver().drive()` inside `useEffect` or an event handler.
- **No rate limiting on /api/chat:** AI API calls have real costs. Always add rate limiting before shipping.
- **Storing full conversation history in DB without limits:** Truncate to last N messages to keep token costs bounded.
- **react-shepherd with React 19:** The `react-shepherd` wrapper is not compatible with React 19. Use `driver.js` (no React bindings needed, imperative API works fine) or the raw `shepherd.js` directly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming LLM responses | Custom SSE implementation | `streamText` + `toUIMessageStreamResponse()` | Handles backpressure, error recovery, SSE protocol |
| Chat state management | Manual message array + fetch | `useChat` from `@ai-sdk/react` | Handles optimistic updates, streaming state, abort |
| Feature tours | Custom spotlight overlay + step tracker | `driver.js` | DOM positioning math, overlay rendering, keyboard nav are hard |
| Tool calling / function calling | Manual JSON parsing from LLM | AI SDK tools with Zod schemas | SDK enforces schema, handles retries, type-safe |

**Key insight:** The AI streaming and tour systems each solve genuinely hard problems (backpressure, DOM overlay positioning). Use established libraries; the cost is minimal and the correctness gain is high.

---

## Common Pitfalls

### Pitfall 1: Missing `maxDuration` on Chat API Route
**What goes wrong:** Next.js serverless functions default to 10s timeout; streaming responses get cut off mid-message
**Why it happens:** LLM generation takes 5-30s; default serverless timeout is too short
**How to avoid:** Set `export const maxDuration = 30;` at top of `app/api/chat/route.ts`
**Warning signs:** Chat messages cut off, 504 gateway errors in production

### Pitfall 2: Driver.js CSS Not Imported
**What goes wrong:** Tour overlay and popovers render without any styling — looks broken
**Why it happens:** Driver.js ships a separate CSS file that must be explicitly imported
**How to avoid:** Add `import 'driver.js/dist/driver.css';` in the same client component that uses driver.js
**Warning signs:** Tour starts but elements have no overlay, popover is unstyled or invisible

### Pitfall 3: AI API Key Exposed to Client
**What goes wrong:** OpenAI/Anthropic API key gets bundled into client-side JS
**Why it happens:** Putting provider calls in client components instead of route handlers
**How to avoid:** ALL LLM calls MUST live in `app/api/chat/route.ts` (server-only). Never import `@ai-sdk/openai` in a `'use client'` component.
**Warning signs:** API key visible in browser network tab or bundle

### Pitfall 4: Driver.js Called During SSR
**What goes wrong:** `ReferenceError: document is not defined` during server render
**Why it happens:** Driver.js accesses `document` directly; Next.js SSRs components by default
**How to avoid:** Always wrap Driver.js calls in `useEffect` or use `dynamic(() => import(...), { ssr: false })`
**Warning signs:** Build or runtime error about `document` not defined

### Pitfall 5: No Rate Limiting on Chat Endpoint
**What goes wrong:** Bot abuse sends thousands of requests, running up LLM API bills
**Why it happens:** `/api/chat` looks like a normal API but calls an expensive external service
**How to avoid:** Add `express-rate-limit` equivalent for Next.js route handlers — use IP-based limiting or Clerk user ID limiting in middleware
**Warning signs:** Unexpected spikes in OpenAI/Anthropic billing dashboard

### Pitfall 6: `useChat` api path mismatch
**What goes wrong:** Chat requests go to wrong endpoint (404 or wrong handler)
**Why it happens:** Default `useChat` targets `/api/chat` — if route is elsewhere, must pass `api` option
**How to avoid:** Explicitly pass `api: '/api/chat'` (or custom path) to `useChat`
**Warning signs:** Network requests to wrong URL, 404 errors in console

---

## Code Examples

Verified patterns from official sources:

### AI SDK Route Handler (streamText)
```typescript
// Source: https://ai-sdk.dev/docs/getting-started/nextjs-app-router
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: 'You are a helpful e-commerce shopping assistant.',
    messages: await convertToModelMessages(messages),
    maxTokens: 500,
  });

  return result.toUIMessageStreamResponse();
}
```

### useChat Hook (Client)
```typescript
// Source: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
'use client';
import { useChat } from '@ai-sdk/react';

export function ChatInterface() {
  const { messages, sendMessage, status, stop } = useChat({
    api: '/api/chat',
  });

  // status values: 'ready' | 'submitted' | 'streaming' | 'error'
  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <strong>{message.role}:</strong>
          {message.parts.map((part, i) =>
            part.type === 'text' ? <span key={i}>{part.text}</span> : null
          )}
        </div>
      ))}
      {isLoading && <button onClick={stop}>Stop</button>}
    </div>
  );
}
```

### Driver.js Tour (Next.js App Router)
```typescript
// Source: DEV Community verified + driverjs.com docs
'use client';
import { useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function useAdminTour() {
  return useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#sidebar-products',
          popover: {
            title: 'Products',
            description: 'Create and manage your product catalog here.',
            side: 'right',
          },
        },
        {
          element: '#sidebar-orders',
          popover: {
            title: 'Orders',
            description: 'View and manage customer orders.',
            side: 'right',
          },
        },
      ],
    });
    driverObj.drive();
  }, []);
}
```

### Rate Limiting AI Route (Next.js Middleware Pattern)
```typescript
// Simple in-route IP rate limiting (no Redis needed for low traffic)
// apps/client/app/api/chat/route.ts
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxRequests = 10;

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response('Too Many Requests', { status: 429 });
  }
  // ... rest of handler
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual SSE streaming | `streamText().toUIMessageStreamResponse()` | AI SDK 4-6 | Eliminates streaming boilerplate |
| `useCompletion` (text only) | `useChat` with `.parts` array | AI SDK 5+ | Handles multi-part messages, tool results |
| `message.content` string | `message.parts` array | AI SDK 5/6 | Renders text, images, tool calls uniformly |
| Shepherd.js (AGPL) | Driver.js (MIT) | 2023-2024 | No commercial license needed |
| React Joyride | Driver.js or Onborda | 2024 | Driver.js simpler, no React bindings needed |

**Deprecated/outdated:**
- `react-shepherd`: Not compatible with React 19; avoid.
- `useCompletion` for chat: Use `useChat` instead for multi-turn conversations.
- `message.content` property rendering: Use `message.parts` — content is a legacy shortcut that may not include all data.

---

## Open Questions

1. **LLM Provider Choice (OpenAI vs Anthropic)**
   - What we know: Both `@ai-sdk/openai` and `@ai-sdk/anthropic` are supported; GPT-4o-mini is cheapest capable model; Claude Haiku is comparable
   - What's unclear: Which provider the project owner prefers / has API keys for
   - Recommendation: Default to `@ai-sdk/openai` with `gpt-4o-mini` in plans. Make provider swappable via env var. Document both in .env.example.

2. **Tour Persistence (should completed tours be remembered?)**
   - What we know: Driver.js has no built-in persistence; need to track in localStorage or user DB
   - What's unclear: Whether to show tours every session or only once per user
   - Recommendation: Use `localStorage` flag `tour_completed_homepage=true` — simple, no DB needed.

3. **Admin AI Scope**
   - What we know: Admin AI helper should assist with "how to use the admin panel" questions
   - What's unclear: Should admin AI also have access to real data (orders count, revenue) via tool calls?
   - Recommendation: Start with FAQ-style system prompt only (Phase 22). Tool calls for data access = v2 or Phase 23 extension.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | vitest.config.ts (workspace root) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test:coverage` |

### Phase Requirements → Test Map

Phase 22 requirements are TBD (not yet formally defined in REQUIREMENTS.md). Based on the phase description, expected behaviors are:

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| AI chat API route returns streaming response | integration | `pnpm vitest run apps/client/src/__tests__/api/chat.test.ts` | ❌ Wave 0 |
| useChat hook renders messages correctly | unit | `pnpm vitest run apps/client/src/__tests__/components/ChatWidget.test.tsx` | ❌ Wave 0 |
| Rate limiter blocks after N requests | unit | `pnpm vitest run apps/client/src/__tests__/api/chat-rate-limit.test.ts` | ❌ Wave 0 |
| HelpTooltip shows content on hover | unit | `pnpm vitest run apps/client/src/__tests__/components/HelpTooltip.test.tsx` | ❌ Wave 0 |
| Driver.js tour starts (smoke) | manual-only | N/A — DOM tour requires browser | N/A |

**Note:** AI streaming tests will need to mock `streamText` — use `vi.mock('ai', ...)` pattern established in Phase 03.

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test:coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/client/src/__tests__/api/chat.test.ts` — mock `streamText`, test POST handler
- [ ] `apps/client/src/__tests__/components/ChatWidget.test.tsx` — mock `useChat`, test render
- [ ] `apps/admin/src/__tests__/components/AdminChatWidget.test.tsx` — admin assistant render
- [ ] Mock setup for `ai` package in root `vitest.setup.ts`

---

## Sources

### Primary (HIGH confidence)
- `https://ai-sdk.dev/docs/ai-sdk-ui/chatbot` — useChat hook API, streaming patterns
- `https://ai-sdk.dev/docs/getting-started/nextjs-app-router` — Next.js App Router setup, package names
- `https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat` — hook return values, status enum
- `https://driverjs.com/docs/installation` — Driver.js install, basic initialization
- `https://driverjs.com` — MIT license confirmed, 25K stars, framework-agnostic

### Secondary (MEDIUM confidence)
- DEV Community verified Driver.js + Next.js App Router example (cross-checked with official docs)
- WebSearch: AI SDK 6 package names `ai`, `@ai-sdk/react`, `@ai-sdk/openai`, `@ai-sdk/anthropic` — confirmed via npm
- WebSearch: Rate limiting patterns for Next.js AI routes — confirmed as standard practice via Vercel KB

### Tertiary (LOW confidence)
- WebSearch: E-commerce AI assistant context injection patterns — community patterns, not official docs; treat as starting point

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package names and API patterns confirmed via official ai-sdk.dev docs
- Architecture: HIGH — patterns derived directly from official documentation
- Driver.js integration: HIGH — MIT license confirmed, Next.js App Router pattern verified via multiple sources
- Pitfalls: MEDIUM — mix of official docs warnings and community-confirmed gotchas
- E-commerce AI context patterns: MEDIUM — community patterns, not official

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (AI SDK moves fast — re-verify if >90 days old before implementation)
