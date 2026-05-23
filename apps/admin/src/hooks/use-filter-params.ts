'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { FilterConfig } from '@/components/DataTableFilters';

type FilterValue = string | string[] | { from?: string; to?: string } | { min?: number; max?: number };

export function useFilterParams(basePath: string, filterConfigs: FilterConfig[]) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const values = useMemo(() => {
    const result: Record<string, FilterValue> = {};
    for (const config of filterConfigs) {
      switch (config.type) {
        case 'multi-select': {
          const raw = searchParams.get(config.key);
          result[config.key] = raw ? raw.split(',') : [];
          break;
        }
        case 'date-range': {
          result[config.key] = {
            from: searchParams.get(`${config.key}From`) || undefined,
            to: searchParams.get(`${config.key}To`) || undefined,
          };
          break;
        }
        case 'number-range': {
          const min = searchParams.get(`min${capitalize(config.key)}`);
          const max = searchParams.get(`max${capitalize(config.key)}`);
          result[config.key] = {
            min: min ? Number(min) : undefined,
            max: max ? Number(max) : undefined,
          };
          break;
        }
        default: {
          result[config.key] = searchParams.get(config.key) || '';
          break;
        }
      }
    }
    return result;
  }, [searchParams, filterConfigs]);

  const buildParams = useCallback(
    (newValues: Record<string, FilterValue>) => {
      const params = new URLSearchParams();

      // Preserve non-filter params (except page)
      searchParams.forEach((val, key) => {
        if (key !== 'page' && !filterConfigs.some((c) => {
          if (c.type === 'date-range') return key === `${c.key}From` || key === `${c.key}To`;
          if (c.type === 'number-range') return key === `min${capitalize(c.key)}` || key === `max${capitalize(c.key)}`;
          return key === c.key;
        })) {
          params.set(key, val);
        }
      });

      for (const config of filterConfigs) {
        const value = newValues[config.key];
        if (value === undefined || value === '') continue;

        switch (config.type) {
          case 'multi-select': {
            const arr = value as string[];
            if (arr.length > 0) params.set(config.key, arr.join(','));
            break;
          }
          case 'date-range': {
            const dr = value as { from?: string; to?: string };
            if (dr.from) params.set(`${config.key}From`, dr.from);
            if (dr.to) params.set(`${config.key}To`, dr.to);
            break;
          }
          case 'number-range': {
            const nr = value as { min?: number; max?: number };
            if (nr.min !== undefined) params.set(`min${capitalize(config.key)}`, String(nr.min));
            if (nr.max !== undefined) params.set(`max${capitalize(config.key)}`, String(nr.max));
            break;
          }
          default: {
            if (typeof value === 'string' && value) params.set(config.key, value);
            break;
          }
        }
      }

      return params;
    },
    [searchParams, filterConfigs]
  );

  const setFilter = useCallback(
    (key: string, value: FilterValue) => {
      const newValues = { ...values, [key]: value };
      const params = buildParams(newValues);
      const qs = params.toString();
      router.push(`${basePath}${qs ? `?${qs}` : ''}`);
    },
    [values, buildParams, basePath, router]
  );

  const resetFilters = useCallback(() => {
    router.push(basePath);
  }, [basePath, router]);

  return { values, setFilter, resetFilters };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
