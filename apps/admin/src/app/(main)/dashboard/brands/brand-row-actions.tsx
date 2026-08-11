'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { showError } from '@/lib/toast';

export function BrandRowActions({ brandId, onEdit }: { brandId: string; onEdit?: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();

  const handleDelete = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await api.brands.delete(brandId, token);
      router.refresh();
    } catch (err: any) {
      showError(err.message || t('brands.errors.deleteFailed'));
    }
  };

  return (
    <DataTableRowActions actions={[
      { label: t('brands.actions.edit'), ...(onEdit ? { onClick: onEdit } : { href: `/dashboard/brands?action=edit&id=${brandId}` }), icon: <Pencil className="h-4 w-4" /> },
      { label: t('brands.actions.delete'), onClick: handleDelete, variant: 'destructive', icon: <Trash2 className="h-4 w-4" />, confirm: t('brands.actions.deleteConfirm') },
    ]} />
  );
}
