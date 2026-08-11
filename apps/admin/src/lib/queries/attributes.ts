'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { Attribute, AttributeValue, ProductAttributeValue } from '@repo/types';
import type { ProductAttributeValueInput } from '@/lib/api';

// ============================================================================
// Query keys — centralised so mutations can invalidate precisely.
// ============================================================================
export const attributeKeys = {
  all: ['attributes'] as const,
  byCategory: (categoryId: string) => ['attributes', 'category', categoryId] as const,
  detail: (id: string) => ['attributes', 'detail', id] as const,
  productValues: (productId: string) => ['attributes', 'product', productId] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Attributes (with their values) for a category. Public read — no token.
 * `enabled` is gated on a non-empty categoryId so it's safe to call with '' when
 * no category is selected yet.
 */
export function useAttributesByCategory(
  categoryId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: attributeKeys.byCategory(categoryId ?? ''),
    queryFn: async () => {
      const res = await api.attributes.byCategory(categoryId as string);
      return (res.data ?? []) as Attribute[];
    },
    enabled: (options?.enabled ?? true) && !!categoryId,
    staleTime: 30_000,
  });
}

/** Single attribute (with values) by id. Public read. */
export function useAttribute(id: string | null | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: attributeKeys.detail(id ?? ''),
    queryFn: async () => {
      const res = await api.attributes.get(id as string);
      return res.data as Attribute;
    },
    enabled: (options?.enabled ?? true) && !!id,
    staleTime: 30_000,
  });
}

/** A product's selected attribute values (junction rows). Public read. */
export function useProductAttributeValues(
  productId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: attributeKeys.productValues(productId ?? ''),
    queryFn: async () => {
      const res = await api.attributes.getProductValues(productId as string);
      return (res.data ?? []) as ProductAttributeValue[];
    },
    enabled: (options?.enabled ?? true) && !!productId,
    staleTime: 15_000,
  });
}

// ============================================================================
// Mutations
// ============================================================================

type AttributeCreateInput = Parameters<typeof api.attributes.create>[0];
type AttributeValueCreateInput = Parameters<typeof api.attributes.createValue>[0];

/** Create an attribute under a category. Invalidates the category's list. */
export function useCreateAttribute() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (data: AttributeCreateInput) => {
      const token = await getToken();
      const res = await api.attributes.create(data, token ?? undefined);
      return res.data as Attribute;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: attributeKeys.byCategory(variables.categoryId) });
    },
  });
}

/** Update an attribute. Caller passes categoryId so we invalidate the list. */
export function useUpdateAttribute() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      categoryId?: string;
      data: Partial<Attribute>;
    }) => {
      const token = await getToken();
      const res = await api.attributes.update(id, data, token ?? undefined);
      return res.data as Attribute;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: attributeKeys.detail(variables.id) });
      if (variables.categoryId) {
        qc.invalidateQueries({ queryKey: attributeKeys.byCategory(variables.categoryId) });
      }
    },
  });
}

/** Delete an attribute (cascades its values server-side). */
export function useDeleteAttribute() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({ id }: { id: string; categoryId?: string }) => {
      const token = await getToken();
      await api.attributes.remove(id, token ?? undefined);
    },
    onSuccess: (_data, variables) => {
      if (variables.categoryId) {
        qc.invalidateQueries({ queryKey: attributeKeys.byCategory(variables.categoryId) });
      }
    },
  });
}

/** Bulk reorder attributes (drag-and-drop). */
export function useReorderAttributes() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({
      order,
    }: {
      categoryId?: string;
      order: Array<{ id: string; sortOrder: number }>;
    }) => {
      const token = await getToken();
      await api.attributes.reorder(order, token ?? undefined);
    },
    onSuccess: (_data, variables) => {
      if (variables.categoryId) {
        qc.invalidateQueries({ queryKey: attributeKeys.byCategory(variables.categoryId) });
      }
    },
  });
}

/** Create an attribute value (the "common option"). 409 on duplicate value. */
export function useCreateAttributeValue() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({
      data,
    }: {
      categoryId?: string;
      data: AttributeValueCreateInput;
    }) => {
      const token = await getToken();
      const res = await api.attributes.createValue(data, token ?? undefined);
      return res.data as AttributeValue;
    },
    onSuccess: (_data, variables) => {
      if (variables.categoryId) {
        qc.invalidateQueries({ queryKey: attributeKeys.byCategory(variables.categoryId) });
      }
    },
  });
}

/** Update an attribute value. */
export function useUpdateAttributeValue() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      categoryId?: string;
      data: Partial<AttributeValue>;
    }) => {
      const token = await getToken();
      const res = await api.attributes.updateValue(id, data, token ?? undefined);
      return res.data as AttributeValue;
    },
    onSuccess: (_data, variables) => {
      if (variables.categoryId) {
        qc.invalidateQueries({ queryKey: attributeKeys.byCategory(variables.categoryId) });
      }
    },
  });
}

/** Delete an attribute value. */
export function useDeleteAttributeValue() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({ id }: { id: string; categoryId?: string }) => {
      const token = await getToken();
      await api.attributes.removeValue(id, token ?? undefined);
    },
    onSuccess: (_data, variables) => {
      if (variables.categoryId) {
        qc.invalidateQueries({ queryKey: attributeKeys.byCategory(variables.categoryId) });
      }
    },
  });
}

/** Bulk reorder attribute values (drag-and-drop within one attribute). */
export function useReorderAttributeValues() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({
      order,
    }: {
      categoryId?: string;
      order: Array<{ id: string; sortOrder: number }>;
    }) => {
      const token = await getToken();
      await api.attributes.valuesReorder(order, token ?? undefined);
    },
    onSuccess: (_data, variables) => {
      if (variables.categoryId) {
        qc.invalidateQueries({ queryKey: attributeKeys.byCategory(variables.categoryId) });
      }
    },
  });
}

/**
 * Bulk-set a product's attribute values (delete-all-then-createMany server
 * side). Invalidates that product's junction cache.
 */
export function useSetProductAttributeValues() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({
      productId,
      values,
    }: {
      productId: string;
      values: ProductAttributeValueInput[];
    }) => {
      const token = await getToken();
      const res = await api.attributes.setProductValues(productId, values, token ?? undefined);
      return (res.data ?? []) as ProductAttributeValue[];
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: attributeKeys.productValues(variables.productId) });
    },
  });
}
