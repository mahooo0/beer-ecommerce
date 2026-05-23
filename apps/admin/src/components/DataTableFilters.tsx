'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { NumberRangeInput } from '@/components/ui/number-range-input';
import { Combobox } from '@/components/ui/combobox';

export type FilterConfig =
  | { key: string; label: string; type: 'search'; placeholder?: string }
  | { key: string; label: string; type: 'select'; placeholder?: string; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'multi-select'; placeholder?: string; options: { value: string; label: string }[]; searchable?: boolean }
  | { key: string; label: string; type: 'date-range'; placeholder?: string }
  | { key: string; label: string; type: 'number-range'; placeholder?: string; prefix?: string }
  | { key: string; label: string; type: 'combobox'; placeholder?: string; options: { value: string; label: string; description?: string }[] };

type FilterValue = string | string[] | { from?: string; to?: string } | { min?: number; max?: number };

interface DataTableFiltersProps {
  filters: FilterConfig[];
  values: Record<string, FilterValue>;
  onChange: (key: string, value: FilterValue) => void;
  onReset?: () => void;
}

function isFilterActive(config: FilterConfig, value: FilterValue): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value !== '';
  if (Array.isArray(value)) return value.length > 0;
  if ('from' in value || 'to' in value) {
    const dr = value as { from?: string; to?: string };
    return !!(dr.from || dr.to);
  }
  if ('min' in value || 'max' in value) {
    const nr = value as { min?: number; max?: number };
    return nr.min !== undefined || nr.max !== undefined;
  }
  return false;
}

function getFilterDisplayValue(config: FilterConfig, value: FilterValue): string {
  if (typeof value === 'string') {
    if (config.type === 'select' || config.type === 'combobox') {
      const opt = config.options?.find((o) => o.value === value);
      return opt?.label || value;
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (config.type === 'multi-select') {
      return value
        .map((v) => config.options?.find((o) => o.value === v)?.label || v)
        .join(', ');
    }
    return value.join(', ');
  }
  if ('from' in value || 'to' in value) {
    const dr = value as { from?: string; to?: string };
    if (dr.from && dr.to) return `${dr.from} – ${dr.to}`;
    if (dr.from) return `From ${dr.from}`;
    if (dr.to) return `To ${dr.to}`;
    return '';
  }
  if ('min' in value || 'max' in value) {
    const nr = value as { min?: number; max?: number };
    if (nr.min !== undefined && nr.max !== undefined) return `${nr.min} – ${nr.max}`;
    if (nr.min !== undefined) return `Min: ${nr.min}`;
    if (nr.max !== undefined) return `Max: ${nr.max}`;
    return '';
  }
  return '';
}

function getEmptyValue(config: FilterConfig): FilterValue {
  switch (config.type) {
    case 'multi-select': return [];
    case 'date-range': return { from: undefined, to: undefined };
    case 'number-range': return { min: undefined, max: undefined };
    default: return '';
  }
}

function DebouncedSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 300);
  };

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-[200px] pl-9"
      />
    </div>
  );
}

export function DataTableFilters({
  filters,
  values,
  onChange,
  onReset,
}: DataTableFiltersProps) {
  const activeFilters = filters.filter((f) => {
    const val = values[f.key];
    return val !== undefined && isFilterActive(f, val);
  });
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3 items-end rounded-lg border bg-card p-4">
        {filters.map((filter) => (
          <div key={filter.key} className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">{filter.label}</Label>
            {filter.type === 'search' && (
              <DebouncedSearchInput
                value={(values[filter.key] as string) || ''}
                onChange={(v) => onChange(filter.key, v)}
                placeholder={filter.placeholder || 'Search...'}
              />
            )}
            {filter.type === 'select' && (
              <Select
                value={(values[filter.key] as string) || '_all_'}
                onValueChange={(val) => onChange(filter.key, val === '_all_' ? '' : val)}
              >
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder={filter.placeholder || 'All'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">
                    {filter.placeholder || 'All'}
                  </SelectItem>
                  {filter.options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filter.type === 'multi-select' && (
              <MultiSelect
                options={filter.options}
                value={(values[filter.key] as string[]) || []}
                onChange={(v) => onChange(filter.key, v)}
                placeholder={filter.placeholder}
                searchable={filter.searchable}
              />
            )}
            {filter.type === 'date-range' && (
              <DateRangePicker
                value={(values[filter.key] as { from?: string; to?: string }) || {}}
                onChange={(v) => onChange(filter.key, v)}
                placeholder={filter.placeholder}
              />
            )}
            {filter.type === 'number-range' && (
              <NumberRangeInput
                value={(values[filter.key] as { min?: number; max?: number }) || {}}
                onChange={(v) => onChange(filter.key, v)}
                prefix={filter.prefix}
              />
            )}
            {filter.type === 'combobox' && (
              <Combobox
                options={filter.options}
                value={(values[filter.key] as string) || ''}
                onChange={(v) => onChange(filter.key, v)}
                placeholder={filter.placeholder}
              />
            )}
          </div>
        ))}
        {hasActiveFilters && onReset && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-9">
            Reset
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="gap-1 pl-2 pr-1 py-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => onChange(filter.key, getEmptyValue(filter))}
            >
              <span className="text-xs font-medium">{filter.label}:</span>
              <span className="text-xs max-w-[150px] truncate">
                {getFilterDisplayValue(filter, values[filter.key] ?? '')}
              </span>
              <X className="h-3 w-3 ml-0.5" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
