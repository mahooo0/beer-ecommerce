'use client';

import { useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { setUserRole } from '../actions';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type RoleFormProps = {
  userId: string;
  currentRole: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
};

export function RoleForm({ userId, currentRole }: RoleFormProps) {
  const { t } = useTranslation();
  const [role, setRole] = useState<RoleFormProps['currentRole']>(currentRole);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        await setUserRole(userId, role);
        setMessage({ type: 'success', text: t('users.toasts.roleUpdated') });
      } catch {
        setMessage({ type: 'error', text: t('users.toasts.roleUpdateFailed') });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="role">{t('users.roleForm.label')}</Label>
        <Select
          value={role}
          onValueChange={(v) => setRole(v as RoleFormProps['currentRole'])}
          disabled={isPending}
        >
          <SelectTrigger id="role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CUSTOMER">{t('users.roles.CUSTOMER')}</SelectItem>
            <SelectItem value="ADMIN">{t('users.roles.ADMIN')}</SelectItem>
            <SelectItem value="SUPER_ADMIN">{t('users.roles.SUPER_ADMIN')}</SelectItem>
          </SelectContent>
        </Select>
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

      <Button type="submit" disabled={isPending || role === currentRole} className="w-full">
        {isPending ? t('users.roleForm.updating') : t('users.roleForm.update')}
      </Button>
    </form>
  );
}
