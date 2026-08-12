'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * Theme-aware published/draft pill, shared by the blog posts and content-pages
 * lists. Uses tinted background + `dark:` text tokens so it reads correctly in
 * both light and dark themes (unlike the old hardcoded green-100/green-700).
 */
export function PublishStatusBadge({
  status,
  labels,
  className,
}: {
  status?: string | null;
  labels?: { published?: string; draft?: string };
  className?: string;
}) {
  const { t } = useTranslation();
  const published = status === 'published';
  const text = published
    ? labels?.published ?? t('blog.status.published')
    : labels?.draft ?? t('blog.status.draft');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        published
          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        className,
      )}
    >
      <span
        className={cn(
          'mr-1.5 h-1.5 w-1.5 rounded-full',
          published ? 'bg-green-500' : 'bg-amber-500',
        )}
      />
      {text}
    </span>
  );
}
