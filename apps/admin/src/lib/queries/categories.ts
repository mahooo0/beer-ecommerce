'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Category } from '@repo/types';

/**
 * Category node as returned by GET /categories/tree — a Category with nested
 * children. The base `Category` type has no `children` field, so we extend it.
 */
export type CategoryTreeNode = Category & { children?: CategoryTreeNode[] };

/**
 * React Query hook for the full category tree (nested).
 * The tree endpoint is public, so no token is required.
 */
export function useCategoryTree(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      const res = await api.categories.getTree();
      return (res.data ?? []) as CategoryTreeNode[];
    },
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}
