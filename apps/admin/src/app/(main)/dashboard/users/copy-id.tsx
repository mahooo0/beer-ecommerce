'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface CopyIdProps {
  value: string;
  /** Constrain width and truncate the id (useful inside dense table cells). */
  className?: string;
  truncate?: boolean;
}

/**
 * Monospace, click-to-copy identifier chip. Matches the admin's "code" styling
 * (font-mono + muted) and is theme-safe in both light and dark modes.
 */
export function CopyId({ value, className, truncate = false }: CopyIdProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (insecure context) — fail silently.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? t('users.detail.copied') : t('users.detail.copy')}
      className={cn(
        'group/copy inline-flex max-w-full items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      <span className={cn('leading-none', truncate && 'truncate')}>{value}</span>
      {copied ? (
        <Check className="h-3 w-3 shrink-0 text-green-600 dark:text-green-500" />
      ) : (
        <Copy className="h-3 w-3 shrink-0 opacity-50 transition-opacity group-hover/copy:opacity-100" />
      )}
    </button>
  );
}
