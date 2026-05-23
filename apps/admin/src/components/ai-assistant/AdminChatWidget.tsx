'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { AdminChatMessages } from './AdminChatMessages';
import { AdminChatInput } from './AdminChatInput';

export function AdminChatWidget() {
  const [open, setOpen] = useState(false);

  const { messages, sendMessage, status } = useChat({
    fetch: (input: any, init: any) => fetch('/api/chat', init),
  } as any);

  const isLoading = status === 'submitted' || status === 'streaming';

  function handleSend(text: string) {
    sendMessage({ text });
  }

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open admin assistant"
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <span className="text-sm font-bold">?</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[28rem] w-80 sm:w-96 flex-col rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-xl border-b bg-indigo-600 px-4 py-3">
            <span className="text-sm font-semibold text-white">
              Admin Assistant
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close admin assistant"
              className="text-indigo-200 hover:text-white focus:outline-none"
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

          {/* Messages */}
          <AdminChatMessages messages={messages} isStreaming={isLoading} />

          {/* Input */}
          <AdminChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      )}
    </>
  );
}
