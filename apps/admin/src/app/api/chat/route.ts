import { streamText, type UIMessage, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';

export const maxDuration = 30;

// IP-based rate limiter: 10 requests per 60-second window
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 60 seconds
  const maxRequests = 10;

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.json();
  const { messages, context } = body as {
    messages: UIMessage[];
    context?: { page?: string };
  };

  const currentPage = context?.page ?? 'dashboard';

  const systemPrompt = `You are an admin panel assistant for an e-commerce platform.
Current admin page: ${currentPage}.
Help administrators with:
- How to create, edit, and manage products (simple, variable, weighted, digital, bundled types)
- How to manage categories, brands, tags, and collections
- How to set up shipping zones and methods
- How to manage inventory across warehouses
- How to configure search settings and synonyms
- How to manage user accounts and roles
- General admin panel navigation and features
Keep answers concise and actionable. Reference specific admin panel sections when possible.
If asked about technical issues or bugs, suggest checking the documentation or contacting the development team.`;

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 500,
  });

  return result.toUIMessageStreamResponse();
}
