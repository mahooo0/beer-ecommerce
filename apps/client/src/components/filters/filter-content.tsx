'use client';

import React from 'react';
import type { CategoryAttribute } from '@repo/types';
import { PriceFilter } from './price-filter';
import { AttributeFilter } from './attribute-filter';
import { AvailabilityFilter } from './availability-filter';
import { Checkbox } from '../ui/checkbox';
import { useFilters } from '../../hooks/use-filters';

interface FacetCount {
  value: string;
  count: number;
}

interface BrandFacet {
  name: string;
  count: number;
}

interface AvailabilityFacet {
  in_stock?: number;
  out_of_stock?: number;
  pre_order?: number;
}

interface PriceRange {
  min: number;
  max: number;
}

export interface FilterContentProps {
  categoryAttributes: CategoryAttribute[];
  facetCounts: {
    brands: BrandFacet[];
    attributes: Record<string, FacetCount[]>;
    availability: AvailabilityFacet;
    priceRange: PriceRange;
  };
}

function Separator() {
  return <hr className="border-border-secondary" />;
}

function BrandFilter({ brands }: { brands: BrandFacet[] }) {
  const [filters, setFilters] = useFilters();

  if (brands.length === 0) return null;

  const toggle = (brandName: string) => {
    const current = filters.brands;
    const updated = current.includes(brandName)
      ? current.filter((b) => b !== brandName)
      : [...current, brandName];
    setFilters({ brands: updated, page: 1 });
  };

  return (
    <div className="space-y-2" data-testid="brand-filter">
      <h3 className="text-sm font-semibold text-primary">Brand</h3>
      <div className="space-y-1.5">
        {brands.map(({ name, count }) => {
          const checked = filters.brands.includes(name);
          return (
            <div
              key={name}
              className="flex items-center justify-between"
              data-testid={`brand-option-${name}`}
            >
              <Checkbox
                isSelected={checked}
                onChange={() => toggle(name)}
                aria-label={`Brand: ${name}`}
                label={<span className="text-secondary">{name}</span>}
              />
              {count !== undefined && (
                <span className="text-xs text-quaternary" data-testid="brand-facet-count">
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

export function FilterContent({ categoryAttributes, facetCounts }: FilterContentProps) {
  return (
    <div className="space-y-4" data-testid="filter-content">
      <PriceFilter
        minPrice={facetCounts.priceRange.min}
        maxPrice={facetCounts.priceRange.max}
      />

      <Separator />

      <BrandFilter brands={facetCounts.brands} />

      {facetCounts.brands.length > 0 && <Separator />}

      {categoryAttributes
        .filter((attr) => attr.isFilterable)
        .sort((a, b) => a.position - b.position)
        .map((attr, index, arr) => (
          <React.Fragment key={attr.id}>
            <AttributeFilter
              attribute={attr}
              facetCounts={facetCounts.attributes[attr.key]}
            />
            {index < arr.length - 1 && <Separator />}
          </React.Fragment>
        ))}

      {categoryAttributes.filter((attr) => attr.isFilterable).length > 0 && (
        <Separator />
      )}

      <AvailabilityFilter facetCounts={facetCounts.availability} />
    </div>
  );
}
