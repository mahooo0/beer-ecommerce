import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 30;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

interface ChatContext {
  page?: string;
  productName?: string;
  category?: string;
}

export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return new Response('Too many requests. Please wait before sending more messages.', {
      status: 429,
    });
  }

  const body = await req.json() as { messages: UIMessage[]; context?: ChatContext };
  const { messages, context } = body;

  const contextLines: string[] = [
    'You are a helpful shopping assistant for an e-commerce store.',
    'Store: E-Commerce Store.',
    `Current page: ${context?.page ?? 'homepage'}.`,
  ];

  if (context?.productName) {
    contextLines.push(
      `User is viewing: "${context.productName}" in ${context.category ?? 'General'}.`,
    );
  }

  contextLines.push(
    'Policies: Free shipping over $50. 30-day returns. We accept all major credit cards.',
    'Help users find products, answer questions about orders, shipping, and returns.',
    'Keep responses concise (2-3 sentences max).',
    'If asked about specific inventory or real-time pricing, suggest contacting support for accurate data.',
  );

  const systemPrompt = contextLines.join('\n');

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    maxTokens: 500,
  });

  return result.toUIMessageStreamResponse();
}
