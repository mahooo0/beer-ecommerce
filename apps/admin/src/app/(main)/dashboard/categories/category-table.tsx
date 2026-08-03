'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import type { Category } from '@repo/types';
import { Pencil, SlidersHorizontal, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { showError } from '@/lib/toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CategoryTableProps {
  categories: Category[];
  onEditCategory?: (category: Category) => void;
}

export default function CategoryTable({ categories, onEditCategory }: CategoryTableProps) {
  const router = useRouter();
  const { getToken } = useAuth();

  const handleDelete = async (categoryId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await api.categories.delete(categoryId, token);
      router.refresh();
    } catch (err: any) {
      showError(err.message || 'Failed to delete category');
    }
  };

  // Sort by path for hierarchical ordering
  const sorted = [...categories].sort((a, b) => (a.path || '').localeCompare(b.path || ''));

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Depth</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((category) => (
            <TableRow key={category.id}>
              <TableCell
                className="font-medium text-foreground"
                style={{ paddingLeft: `${(category.depth || 0) * 20 + 16}px` }}
              >
                <Link
                  href={`/dashboard/categories/${category.id}`}
                  className="hover:underline"
                >
                  {category.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{category.slug}</TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs">{category.path || '/'}</TableCell>
              <TableCell className="text-muted-foreground">{category.depth ?? 0}</TableCell>
              <TableCell className="text-right">
                <DataTableRowActions actions={[
                  { label: 'Edit', ...(onEditCategory ? { onClick: () => onEditCategory(category) } : { href: `/dashboard/categories/${category.id}` }), icon: <Pencil className="h-4 w-4" /> },
                  { label: 'Attributes & Filters', href: `/dashboard/categories/${category.id}`, icon: <SlidersHorizontal className="h-4 w-4" /> },
                  { label: 'Delete', onClick: () => handleDelete(category.id), variant: 'destructive', icon: <Trash2 className="h-4 w-4" />, confirm: `Are you sure you want to delete "${category.name}"?` },
                ]} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {sorted.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No categories found.</div>
      )}
    </div>
  );
}
