'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateUserForm } from './create-user-form';

export function CreateUserButton({ onCreated }: { onCreated?: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t('users.addUser')}
      </Button>
      <CreateUserForm open={open} onOpenChange={setOpen} onCreated={onCreated} />
    </>
  );
}
