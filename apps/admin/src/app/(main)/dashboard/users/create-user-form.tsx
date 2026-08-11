'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createUser } from './actions';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

export function CreateUserForm({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      await createUser(formData);
      onCreated?.();
      onOpenChange(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('users.toasts.createFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.form.title')}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">{t('users.form.firstName')}</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">{t('users.form.lastName')}</Label>
              <Input id="lastName" name="lastName" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{t('users.form.email')}</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t('users.form.password')}</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role">{t('users.form.role')}</Label>
            <NativeSelect id="role" name="role" defaultValue="CUSTOMER" className="w-full">
              <NativeSelectOption value="CUSTOMER">{t('users.roles.CUSTOMER')}</NativeSelectOption>
              <NativeSelectOption value="ADMIN">{t('users.roles.ADMIN')}</NativeSelectOption>
              <NativeSelectOption value="SUPER_ADMIN">{t('users.roles.SUPER_ADMIN')}</NativeSelectOption>
            </NativeSelect>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('users.form.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('users.form.creating') : t('users.form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
