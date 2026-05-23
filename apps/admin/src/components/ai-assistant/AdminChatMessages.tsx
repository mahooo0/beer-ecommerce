'use client';

import { useEffect, useRef } from 'react';
import { type UIMessage } from 'ai';

interface AdminChatMessagesProps {
  messages: UIMessage[];
  isStreaming: boolean;
}

export function AdminChatMessages({
  messages,
  isStreaming,
}: AdminChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-3 flex items-center justify-center">
        <p className="text-sm text-gray-500 text-center">
          Hi! I&apos;m your admin assistant. Ask me about managing products,
          orders, shipping, or any admin feature.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((message) => {
        const isUser = message.role === 'user';
        const textParts = message.parts.filter(
          (p): p is { type: 'text'; text: string } => p.type === 'text'
        );

        return (
          <div
            key={message.id}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                isUser
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {textParts.map((part, i) => (
                <span key={i}>{part.text}</span>
              ))}
            </div>
          </div>
        );
      })}
      {isStreaming &&
        messages.length > 0 &&
        messages[messages.length - 1]!.role === 'user' && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-500">
              Thinking...
            </div>
          </div>
        )}
      <div ref={bottomRef} />
    </div>
  );
}
