'use client';

import { useState, FormEvent } from 'react';

interface AdminChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export function AdminChatInput({ onSend, isLoading }: AdminChatInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || isLoading) return;
    onSend(text);
    setValue('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t p-3 flex gap-2"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask about admin features..."
        disabled={isLoading}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
}
