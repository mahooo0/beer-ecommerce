'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

export function ChatWidget() {
  const [open, setOpen] = useState(false);

  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  function handleSend(text: string) {
    sendMessage({ text });
  }

  const chatMessages = messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: (msg.parts ?? []).map((part) => {
      if (typeof part === 'object' && part !== null && 'type' in part && part.type === 'text') {
        return { type: 'text', text: (part as { type: string; text: string }).text };
      }
      return { type: 'text', text: '' };
    }),
  }));

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[28rem] w-80 flex-col rounded-xl bg-white shadow-2xl sm:w-96">
          <div className="flex items-center justify-between rounded-t-xl bg-blue-600 px-4 py-3">
            <span className="font-semibold text-white">Shopping Assistant</span>
            <button
              onClick={() => setOpen(false)}
              className="text-white hover:text-blue-200"
              aria-label="Close chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <ChatMessages messages={chatMessages} isStreaming={isLoading} />

          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
        aria-label="Open shopping assistant"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    </>
  );
}
