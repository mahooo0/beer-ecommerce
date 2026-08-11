'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFilters } from '../../hooks/use-filters';
import { Checkbox } from '../ui/checkbox';

interface AvailabilityFacet {
  in_stock?: number;
  out_of_stock?: number;
  pre_order?: number;
}

interface AvailabilityFilterProps {
  facetCounts?: AvailabilityFacet;
}

const OPTIONS = [
  { key: 'in_stock', labelKey: 'availability.inStock' },
  { key: 'out_of_stock', labelKey: 'availability.outOfStock' },
  { key: 'pre_order', labelKey: 'availability.preOrder' },
] as const;

export function AvailabilityFilter({ facetCounts }: AvailabilityFilterProps) {
  const { t } = useTranslation('categories');
  const [filters, setFilters] = useFilters();

  const toggle = (value: 'in_stock' | 'out_of_stock' | 'pre_order') => {
    const current = filters.availability;
    const updated = current.includes(value)
      ? current.filter((a) => a !== value)
      : [...current, value];
    setFilters({ availability: updated, page: 1 });
  };

  return (
    <div className="space-y-2" data-testid="availability-filter">
      <h3 className="text-sm font-semibold text-primary">{t('availability.label')}</h3>
      <div className="space-y-1.5">
        {OPTIONS.map(({ key, labelKey }) => {
          const label = t(labelKey);
          const count = facetCounts?.[key];
          const checked = filters.availability.includes(key);
          return (
            <div key={key} className="flex items-center justify-between" data-testid={`availability-${key.replace('_', '-')}`}>
              <Checkbox
                isSelected={checked}
                onChange={() => toggle(key)}
                aria-label={label}
                label={<span className="text-secondary">{label}</span>}
              />
              {count !== undefined && (
                <span className="text-xs text-quaternary" data-testid={`${key.replace('_', '-')}-count`}>
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
