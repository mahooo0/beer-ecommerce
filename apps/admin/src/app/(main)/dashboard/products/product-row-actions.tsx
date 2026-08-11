'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { showError } from '@/lib/toast';

export function ProductRowActions({ productId }: { productId: string }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { t } = useTranslation();

  const handleDelete = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await api.products.delete(productId, token);
      router.refresh();
    } catch (err: any) {
      showError(err.message || t('products.toasts.deleteFailed'));
    }
  };

  return (
    <DataTableRowActions actions={[
      { label: t('products.actions.edit'), href: `/dashboard/products/${productId}`, icon: <Pencil className="h-4 w-4" /> },
      { label: t('products.actions.delete'), onClick: handleDelete, variant: 'destructive', icon: <Trash2 className="h-4 w-4" />, confirm: t('products.actions.deleteConfirm') },
    ]} />
  );
}
