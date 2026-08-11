import { draftMode } from 'next/headers';

/** Turn draft mode off (clears the preview cookie). */
export async function GET(): Promise<Response> {
  const draft = await draftMode();
  draft.disable();
  return new Response('Draft mode disabled', { status: 200 });
}
