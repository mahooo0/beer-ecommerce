'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { showError } from '@/lib/toast';

export function CategoryRowActions({
  categoryId,
  onEdit,
}: {
  categoryId: string | number;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();

  const handleDelete = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await api.blog.remove('categories', categoryId, undefined, token);
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : t('blogCategories.errors.deleteFailed'));
    }
  };

  return (
    <DataTableRowActions
      actions={[
        { label: t('blogCategories.actions.edit'), onClick: onEdit, icon: <Pencil className="h-4 w-4" /> },
        {
          label: t('blogCategories.actions.delete'),
          onClick: handleDelete,
          variant: 'destructive',
          icon: <Trash2 className="h-4 w-4" />,
          confirm: t('blogCategories.actions.deleteConfirm'),
        },
      ]}
    />
  );
}
