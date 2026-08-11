'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { showError } from '@/lib/toast';

export function PromoBannerRowActions({ bannerId, onEdit }: { bannerId: string; onEdit: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();

  const handleDelete = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await api.promoBanners.delete(bannerId, token);
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : t('promoBanners.errors.deleteFailed'));
    }
  };

  return (
    <DataTableRowActions
      actions={[
        { label: t('promoBanners.actions.edit'), onClick: onEdit, icon: <Pencil className="h-4 w-4" /> },
        { label: t('promoBanners.actions.delete'), onClick: handleDelete, variant: 'destructive', icon: <Trash2 className="h-4 w-4" />, confirm: t('promoBanners.actions.deleteConfirm') },
      ]}
    />
  );
}
