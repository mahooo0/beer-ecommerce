'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { showError } from '@/lib/toast';

export function BrandRowActions({ brandId, onEdit }: { brandId: string; onEdit?: () => void }) {
  const router = useRouter();
  const { getToken } = useAuth();

  const handleDelete = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await api.brands.delete(brandId, token);
      router.refresh();
    } catch (err: any) {
      showError(err.message || 'Failed to delete brand');
    }
  };

  return (
    <DataTableRowActions actions={[
      { label: 'Edit', ...(onEdit ? { onClick: onEdit } : { href: `/dashboard/brands?action=edit&id=${brandId}` }), icon: <Pencil className="h-4 w-4" /> },
      { label: 'Delete', onClick: handleDelete, variant: 'destructive', icon: <Trash2 className="h-4 w-4" />, confirm: 'Are you sure you want to delete this brand?' },
    ]} />
  );
}
