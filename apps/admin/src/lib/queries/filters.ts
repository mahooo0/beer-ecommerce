'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { CategoryFilter, CategoryFilterOption } from '@repo/types';

// ============================================================================
// Manual category filters ("добавить фильтр для категории"). Distinct from the
// structured Attribute model — these are ad-hoc per-category filter definitions
// with optional options. Mounted under the category router (see api.ts →
// api.categories.filters.*).
// ============================================================================

export const filterKeys = {
  all: ['category-filters'] as const,
  byCategory: (categoryId: string) => ['category-filters', 'category', categoryId] as const,
};

// ============================================================================
// Query
// ============================================================================

/** Manual filters (with options) for a category. Public read — no token. */
export function useFiltersByCategory(
  categoryId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: filterKeys.byCategory(categoryId ?? ''),
    queryFn: async () => {
      const res = await api.categories.filters.byCategory(categoryId as string);
      return (res.data ?? []) as CategoryFilter[];
    },
    enabled: (options?.enabled ?? true) && !!categoryId,
    staleTime: 30_000,
  });
}

// ============================================================================
// Mutations
// ============================================================================

type FilterOptionCreateInput = Parameters<typeof api.categories.filters.createOption>[0];

/** Create a manual filter under a category. */
export function useCreateFilter() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: Partial<CategoryFilter>;
    }) => {
      const token = await getToken();
      const res = await api.categories.filters.create(categoryId, data, token ?? undefined);
      return res.data as CategoryFilter;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: filterKeys.byCategory(variables.categoryId) });
    },
  });
}

/** Update a manual filter. */
export function useUpdateFilter() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      categoryId?: string;
      data: Partial<CategoryFilter>;
    }) => {
      const token = await getToken();
      const res = await api.categories.filters.update(id, data, token ?? undefined);
      return res.data as CategoryFilter;
    },
    onSuccess: (_data, variables) => {
      if (variables.categoryId) {
        qc.invalidateQueries({ queryKey: filterKeys.byCategory(variables.categoryId) });
      }
    },
  });
}

/** Delete a manual filter (cascades its options server-side). */
export function useDeleteFilter() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({ id }: { id: string; categoryId?: string }) => {
      const token = await getToken();
      await api.categories.filters.remove(id, token ?? undefined);
    },
    onSuccess: (_data, variables) => {
      if (variables.categoryId) {
        qc.invalidateQueries({ queryKey: filterKeys.byCategory(variables.categoryId) });
      }
    },
  });
}

/** Create an option under a manual filter. */
export function useCreateFilterOption() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({
      data,
    }: {
      categoryId?: string;
      data: FilterOptionCreateInput;
    }) => {
      const token = await getToken();
      const res = await api.categories.filters.createOption(data, token ?? undefined);
      return res.data as CategoryFilterOption;
    },
    onSuccess: (_data, variables) => {
      if (variables.categoryId) {
        qc.invalidateQueries({ queryKey: filterKeys.byCategory(variables.categoryId) });
      }
    },
  });
}

/** Delete a filter option. */
export function useDeleteFilterOption() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({ id }: { id: string; categoryId?: string }) => {
      const token = await getToken();
      await api.categories.filters.removeOption(id, token ?? undefined);
    },
    onSuccess: (_data, variables) => {
      if (variables.categoryId) {
        qc.invalidateQueries({ queryKey: filterKeys.byCategory(variables.categoryId) });
      }
    },
  });
}

/**
 * Auto-populate a manufacturer-source filter's options from the distinct
 * manufacturers found on products in the category. Returns the number added.
 */
export function useAutoPopulateFilter() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({ id }: { id: string; categoryId?: string }) => {
      const token = await getToken();
      const res = await api.categories.filters.autoPopulate(id, token ?? undefined);
      return res.data as { count: number };
    },
    onSuccess: (_data, variables) => {
      if (variables.categoryId) {
        qc.invalidateQueries({ queryKey: filterKeys.byCategory(variables.categoryId) });
      }
    },
  });
}
