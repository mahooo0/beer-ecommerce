'use client';

import { useEffect, useRef } from 'react';

interface MessagePart {
  type: string;
  text?: string;
}

interface Message {
  id: string;
  role: string;
  parts: MessagePart[];
}

interface ChatMessagesProps {
  messages: Message[];
  isStreaming: boolean;
}

export function ChatMessages({ messages, isStreaming }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-center text-sm text-gray-500">
          Hi! I&apos;m your shopping assistant. How can I help you today?
        </p>
      </div>
    );
  }

  const lastMessage = messages[messages.length - 1];
  const showThinking = isStreaming && lastMessage?.role === 'user';

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
      {messages.map((message) => {
        const isUser = message.role === 'user';
        const textContent = message.parts
          .filter((part) => part.type === 'text' && part.text)
          .map((part) => part.text)
          .join('');

        return (
          <div
            key={message.id}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {textContent}
            </div>
          </div>
        );
      })}
      {showThinking && (
        <div className="flex justify-start">
          <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500">
            Thinking...
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
