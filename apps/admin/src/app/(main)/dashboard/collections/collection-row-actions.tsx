'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import { Pencil, Package, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { showError } from '@/lib/toast';

export function CollectionRowActions({ collectionId, onEdit }: { collectionId: string; onEdit?: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();

  const handleDelete = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await api.collections.delete(collectionId, token);
      router.refresh();
    } catch (err: any) {
      showError(err.message || t('collections.errors.deleteFailed'));
    }
  };

  return (
    <DataTableRowActions actions={[
      { label: t('collections.actions.edit'), ...(onEdit ? { onClick: onEdit } : { href: `/dashboard/collections?action=edit&id=${collectionId}` }), icon: <Pencil className="h-4 w-4" /> },
      { label: t('collections.actions.products'), href: `/dashboard/collections?action=products&id=${collectionId}`, icon: <Package className="h-4 w-4" /> },
      { label: t('collections.actions.delete'), onClick: handleDelete, variant: 'destructive', icon: <Trash2 className="h-4 w-4" />, confirm: t('collections.actions.deleteConfirm') },
    ]} />
  );
}
