'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Eye, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { showError } from '@/lib/toast';

export function ProductRowActions({ productId }: { productId: string }) {
  const router = useRouter();
  const { getToken } = useAuth();

  const handleDelete = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await api.products.delete(productId, token);
      router.refresh();
    } catch (err: any) {
      showError(err.message || 'Failed to delete product');
    }
  };

  return (
    <DataTableRowActions actions={[
      { label: 'View', href: `/dashboard/products/${productId}`, icon: <Eye className="h-4 w-4" /> },
      { label: 'Delete', onClick: handleDelete, variant: 'destructive', icon: <Trash2 className="h-4 w-4" />, confirm: 'Are you sure you want to delete this product?' },
    ]} />
  );
}
