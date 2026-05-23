'use client';

import React from 'react';
import { useFilters } from '../../hooks/use-filters';
import { Checkbox } from '../ui/checkbox';
import type { CategoryAttribute } from '@repo/types';

interface FacetCount {
  value: string;
  count: number;
}

interface AttributeFilterProps {
  attribute: CategoryAttribute;
  facetCounts?: FacetCount[];
}

function getFacetCount(facetCounts: FacetCount[] | undefined, value: string): number | undefined {
  if (!facetCounts) return undefined;
  const found = facetCounts.find((f) => f.value === value);
  return found?.count;
}

export function AttributeFilter({ attribute, facetCounts }: AttributeFilterProps) {
  const [filters, setFilters] = useFilters();

  const attributeKey = attribute.key;

  const isActive = (value: string) =>
    filters.attributes.includes(`${attributeKey}:${value}`);

  const toggle = (value: string) => {
    const filterValue = `${attributeKey}:${value}`;
    const current = filters.attributes;
    const updated = current.includes(filterValue)
      ? current.filter((a) => a !== filterValue)
      : [...current, filterValue];
    setFilters({ attributes: updated, page: 1 });
  };

  const toggleBoolean = () => {
    const filterValue = `${attributeKey}:true`;
    const current = filters.attributes;
    const updated = current.includes(filterValue)
      ? current.filter((a) => a !== filterValue)
      : [...current, filterValue];
    setFilters({ attributes: updated, page: 1 });
  };

  if (attribute.type === 'SELECT') {
    return (
      <div className="space-y-2" data-testid={`attribute-filter-${attributeKey}`}>
        <h3 className="text-sm font-semibold text-primary">{attribute.name}</h3>
        <div className="space-y-1.5">
          {attribute.values.map((value) => {
            const count = getFacetCount(facetCounts, value);
            const checked = isActive(value);
            return (
              <div key={value} className="flex items-center justify-between" data-testid={`attribute-option-${value}`}>
                <Checkbox
                  isSelected={checked}
                  onChange={() => toggle(value)}
                  aria-label={`${attribute.name}: ${value}`}
                  label={
                    <span className="text-secondary">
                      {value}
                      {attribute.unit && ` ${attribute.unit}`}
                    </span>
                  }
                />
                {count !== undefined && (
                  <span className="text-xs text-quaternary" data-testid="facet-count">
                    ({count})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (attribute.type === 'RANGE') {
    const values = attribute.values;
    const minVal = values[0] ? parseFloat(values[0]) : 0;
    const lastValue = values[values.length - 1];
    const maxVal = lastValue ? parseFloat(lastValue) : 100;

    const activeAttrs = filters.attributes.filter((a) => a.startsWith(`${attributeKey}:`));
    const activeMax = activeAttrs.length > 0 && activeAttrs[0]
      ? parseFloat(activeAttrs[0].split(':')[1] ?? maxVal.toString())
      : maxVal;

    return (
      <div className="space-y-3" data-testid={`attribute-filter-${attributeKey}`}>
        <h3 className="text-sm font-semibold text-primary">
          {attribute.name}
          {attribute.unit && ` (${attribute.unit})`}
        </h3>
        <input
          type="range"
          min={minVal}
          max={maxVal}
          step={values.length > 1 ? parseFloat(values[1] || '1') - minVal : 1}
          value={activeMax}
          onChange={(e) => {
            const val = e.target.value;
            const filterValue = `${attributeKey}:${val}`;
            const updated = filters.attributes
              .filter((a) => !a.startsWith(`${attributeKey}:`))
              .concat(filterValue);
            setFilters({ attributes: updated, page: 1 });
          }}
          className="w-full h-1.5 bg-secondary_subtle rounded-full appearance-none cursor-pointer accent-[var(--color-brand-600)]"
          style={{
            background: `linear-gradient(to right, var(--color-brand-600) ${((activeMax - minVal) / (maxVal - minVal)) * 100}%, var(--color-bg-secondary_subtle) ${((activeMax - minVal) / (maxVal - minVal)) * 100}%)`,
          }}
          data-testid={`attribute-range-slider-${attributeKey}`}
          aria-label={`${attribute.name} range`}
        />
        <div className="flex justify-between text-xs text-tertiary">
          <span>{minVal}{attribute.unit}</span>
          <span className="font-medium text-secondary">{activeMax}{attribute.unit}</span>
        </div>
      </div>
    );
  }

  if (attribute.type === 'BOOLEAN') {
    const checked = isActive('true');
    return (
      <div data-testid={`attribute-filter-${attributeKey}`}>
        <Checkbox
          isSelected={checked}
          onChange={toggleBoolean}
          data-testid={`attribute-boolean-${attributeKey}`}
          aria-label={attribute.name}
          label={<span className="font-semibold text-primary">{attribute.name}</span>}
        />
      </div>
    );
  }

  return null;
}
