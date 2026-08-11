'use client';

import { useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { toggleUserStatus } from '../actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusToggleProps = {
  userId: string;
  isActive: boolean;
  isBanned: boolean;
};

export function StatusToggle({ userId, isActive }: StatusToggleProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = () => {
    setMessage(null);

    startTransition(async () => {
      try {
        // If the user is currently active, toggling bans (disables) them.
        await toggleUserStatus(userId, isActive);
        setMessage({
          type: 'success',
          text: isActive ? t('users.toasts.accountDisabled') : t('users.toasts.accountEnabled'),
        });
      } catch {
        setMessage({ type: 'error', text: t('users.toasts.statusUpdateFailed') });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{t('users.statusToggle.title')}</p>
        <Badge
          variant="secondary"
          className={
            isActive
              ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
              : 'bg-destructive/10 text-destructive'
          }
        >
          {isActive ? t('users.status.active') : t('users.status.disabled')}
        </Badge>
      </div>

      {message && (
        <p
          className={cn(
            'text-sm',
            message.type === 'success'
              ? 'text-green-600 dark:text-green-500'
              : 'text-destructive',
          )}
        >
          {message.text}
        </p>
      )}

      <Button
        onClick={handleToggle}
        disabled={isPending}
        variant={isActive ? 'destructive' : 'default'}
        className="w-full"
      >
        {isPending
          ? t('users.statusToggle.processing')
          : isActive
            ? t('users.statusToggle.disable')
            : t('users.statusToggle.enable')}
      </Button>
    </div>
  );
}
