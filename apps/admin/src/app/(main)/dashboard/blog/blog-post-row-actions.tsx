'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { showError } from '@/lib/toast';

export function BlogPostRowActions({
  postId,
  editHref,
}: {
  postId: string | number;
  editHref: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();

  const handleDelete = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await api.blog.remove('posts', postId, undefined, token);
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : t('blog.errors.deleteFailed'));
    }
  };

  return (
    <DataTableRowActions
      actions={[
        // TODO(editor): point at native /dashboard/blog/[id] once the editor lands.
        {
          label: t('blog.actions.edit'),
          onClick: () => window.open(editHref, '_blank', 'noopener'),
          icon: <Pencil className="h-4 w-4" />,
        },
        {
          label: t('blog.actions.delete'),
          onClick: handleDelete,
          variant: 'destructive',
          icon: <Trash2 className="h-4 w-4" />,
          confirm: t('blog.actions.deleteConfirm'),
        },
      ]}
    />
  );
}
