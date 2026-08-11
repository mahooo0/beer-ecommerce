'use client';

/**
 * KeywordsInput — chip input for `searchKeywords`. Ported from 4fr's
 * components/ui/keywords-input.tsx.
 *
 * taranka adaptation: supports a `disabled` mode. Per the product-form spec the
 * admin does NOT type keywords and there is NO "generate" button — keywords are
 * produced server-side. In disabled mode this renders the existing keyword chips
 * read-only (no text input, no remove buttons), so the admin can still see what
 * is stored without editing it.
 */

import { useState, type KeyboardEvent } from 'react';
import { Badge } from './badge';
import { Input } from './input';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeywordsInputProps {
  value: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function KeywordsInput({
  value,
  onChange,
  placeholder,
  disabled = false,
}: KeywordsInputProps) {
  const [input, setInput] = useState('');

  const addKeywords = (raw: string) => {
    const phrases = raw
      .split(/[,;\n]+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w && !value.includes(w));
    if (phrases.length) onChange([...value, ...phrases]);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeywords(input);
    }
    if (e.key === 'Backspace' && !input && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const remove = (keyword: string) => onChange(value.filter((k) => k !== keyword));

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 min-h-[36px]',
        disabled
          ? 'bg-muted/40 cursor-not-allowed'
          : 'focus-within:ring-1 focus-within:ring-ring'
      )}
    >
      {value.length === 0 && disabled && (
        <span className="text-sm text-muted-foreground px-0.5">
          {placeholder || 'Ключові слова формуються автоматично'}
        </span>
      )}
      {value.map((keyword) => (
        <Badge key={keyword} variant="secondary" className="gap-1 pr-1">
          {keyword}
          {!disabled && (
            <button
              type="button"
              onClick={() => remove(keyword)}
              className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      {!disabled && (
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input && addKeywords(input)}
          onPaste={(e) => {
            e.preventDefault();
            addKeywords(e.clipboardData.getData('text'));
          }}
          placeholder={value.length ? '' : placeholder}
          className="border-0 shadow-none focus-visible:ring-0 h-7 min-w-[120px] flex-1 p-0"
        />
      )}
    </div>
  );
}
