'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { X, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import CategoryPicker from '@/components/CategoryPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// The catalog filter param contract mirrors api.products.filter (see lib/api.ts
// ProductFilterParams). All values live in the URL so the server page re-fetches
// on change and a refresh preserves the admin's view.
export interface ProductsFiltersInitial {
  categoryId?: string;
  status?: string;
  isAvailable?: string; // 'in' | 'out' | ''
  minPrice?: string;
  maxPrice?: string;
  completeness?: string; // 'complete' | 'incomplete' | ''
  attributeValues?: string; // comma-separated AttributeValue ids
}

interface ProductsFiltersProps {
  initialValues: ProductsFiltersInitial;
  /** Kept for callsite compatibility; the picker reads the category tree. */
  categoryOptions?: { value: string; label: string }[];
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Чернетка' },
  { value: 'ACTIVE', label: 'Активний' },
  { value: 'ARCHIVED', label: 'Архів' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'in', label: 'В наявності' },
  { value: 'out', label: 'Немає' },
];

const COMPLETENESS_OPTIONS = [
  { value: 'complete', label: 'Заповнені (100%)' },
  { value: 'incomplete', label: 'Не заповнені' },
];

export function ProductsFilters({ initialValues }: ProductsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();

  const categoryId = initialValues.categoryId || '';
  const status = initialValues.status || '';
  const isAvailable = initialValues.isAvailable || '';
  const completeness = initialValues.completeness || '';
  const selectedAttrValues = useMemo(
    () =>
      new Set(
        (initialValues.attributeValues || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    [initialValues.attributeValues],
  );

  // Local (uncommitted) price inputs — committed to the URL on blur / Enter.
  const [localMinPrice, setLocalMinPrice] = useState(initialValues.minPrice || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(initialValues.maxPrice || '');
  useEffect(() => {
    setLocalMinPrice(initialValues.minPrice || '');
    setLocalMaxPrice(initialValues.maxPrice || '');
  }, [initialValues.minPrice, initialValues.maxPrice]);

  // ── URL writer. Undefined / '' clears the key; page always resets to 1. ──
  const pushParams = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete('page');
      const qs = params.toString();
      router.push(`/dashboard/products${qs ? `?${qs}` : ''}`);
    },
    [router, searchParams],
  );

  const applyPrice = () => {
    pushParams({
      minPrice: localMinPrice || undefined,
      maxPrice: localMaxPrice || undefined,
    });
  };

  // ── Labeled, grouped attribute facets. The attribute defs (with values) give
  // labels + grouping; facet counts overlay the selectable-count next to each. ──
  const { data: attributeGroups } = useQuery({
    queryKey: ['product-filter-attributes', categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.attributes.byCategory(categoryId, token ?? undefined);
      return (res.data ?? []).filter((a) => a.isFilterable && (a.values?.length ?? 0) > 0);
    },
  });

  const { data: facets } = useQuery({
    queryKey: ['product-facets', categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.products.facets({ categoryId, token: token ?? undefined });
      return res.data;
    },
  });

  const facetCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of facets?.attributeValues ?? []) {
      map.set(f.attributeValueId, f.count);
    }
    return map;
  }, [facets]);

  const toggleAttrValue = (valueId: string) => {
    const next = new Set(selectedAttrValues);
    if (next.has(valueId)) next.delete(valueId);
    else next.add(valueId);
    const joined = [...next].join(',');
    pushParams({ attributeValues: joined || undefined });
  };

  const clearAll = () => {
    router.push('/dashboard/products');
  };

  const activeCount = [
    categoryId,
    status,
    isAvailable,
    completeness,
    initialValues.minPrice,
    initialValues.maxPrice,
    selectedAttrValues.size > 0 ? '1' : '',
  ].filter(Boolean).length;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-5">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-semibold">Фільтри</span>
        {activeCount > 0 && (
          <Badge variant="secondary" className="rounded-full px-2 text-xs">
            {activeCount}
          </Badge>
        )}
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="ml-auto h-7 text-xs text-muted-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Очистити
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Категорія</Label>
          <CategoryPicker
            value={categoryId || null}
            onChange={(id) =>
              // Changing category invalidates the attribute-value selection.
              pushParams({ categoryId: id ?? undefined, attributeValues: undefined })
            }
            placeholder="Усі категорії"
          />
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Статус</Label>
          <Select
            value={status || '_all_'}
            onValueChange={(v) => pushParams({ status: v === '_all_' ? undefined : v })}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Усі статуси" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all_">Усі статуси</SelectItem>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Availability */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Наявність</Label>
          <Select
            value={isAvailable || '_all_'}
            onValueChange={(v) => pushParams({ isAvailable: v === '_all_' ? undefined : v })}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Будь-яка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all_">Будь-яка</SelectItem>
              {AVAILABILITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Completeness */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Заповнення</Label>
          <Select
            value={completeness || '_all_'}
            onValueChange={(v) => pushParams({ completeness: v === '_all_' ? undefined : v })}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Усі" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all_">Усі</SelectItem>
              {COMPLETENESS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price range */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ціна (₴)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="від"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              onBlur={applyPrice}
              onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
              className="h-9"
            />
            <span className="text-muted-foreground text-sm">–</span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="до"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              onBlur={applyPrice}
              onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Dynamic attribute-value facets — only when a category is picked and it
          exposes filterable attributes. Counts come from api.products.facets. */}
      {categoryId && attributeGroups && attributeGroups.length > 0 && (
        <>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attributeGroups.map((attr) => (
              <div key={attr.id} className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  {attr.displayName}
                </Label>
                <div className="space-y-1.5">
                  {(attr.values ?? [])
                    .filter((v) => v.isActive)
                    .map((value) => {
                      const count = facetCounts.get(value.id);
                      const checked = selectedAttrValues.has(value.id);
                      const disabled = count === 0 && !checked;
                      return (
                        <label
                          key={value.id}
                          className={`flex items-center gap-2 text-sm ${
                            disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={disabled}
                            onCheckedChange={() => toggleAttrValue(value.id)}
                          />
                          {value.colorCode && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0"
                              style={{ backgroundColor: value.colorCode }}
                            />
                          )}
                          <span className="truncate flex-1">
                            {value.displayValue || value.value}
                          </span>
                          {count !== undefined && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              ({count})
                            </span>
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
