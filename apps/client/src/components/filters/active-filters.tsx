'use client';

import React from 'react';
import { useFilters } from '../../hooks/use-filters';

interface ActiveFilter {
  label: string;
  onRemove: () => void;
}

function FilterBadge({ label, onRemove }: ActiveFilter) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-brand-primary_alt text-brand-secondary rounded-full transition-colors"
      data-testid="active-filter-badge"
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 text-brand-tertiary hover:text-brand-primary focus:outline-none transition-colors"
        aria-label={`Remove filter: ${label}`}
        data-testid="remove-filter-button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </span>
  );
}

export function ActiveFilters() {
  const [filters, setFilters] = useFilters();

  const activeFilters: ActiveFilter[] = [];

  if (filters.minPrice > 0 || (filters.maxPrice > 0 && filters.maxPrice !== 999999)) {
    const minLabel = filters.minPrice > 0 ? `$${(filters.minPrice / 100).toFixed(0)}` : '$0';
    const maxLabel = filters.maxPrice !== 999999 ? `$${(filters.maxPrice / 100).toFixed(0)}` : 'Any';
    activeFilters.push({
      label: `Price: ${minLabel} – ${maxLabel}`,
      onRemove: () => setFilters({ minPrice: 0, maxPrice: 999999, page: 1 }),
    });
  }

  filters.brands.forEach((brand) => {
    activeFilters.push({
      label: `Brand: ${brand}`,
      onRemove: () =>
        setFilters({
          brands: filters.brands.filter((b) => b !== brand),
          page: 1,
        }),
    });
  });

  filters.attributes.forEach((attr) => {
    const [key, value] = attr.split(':');
    const label = value ? `${key?.replace(/_/g, ' ')}: ${value}` : attr;
    activeFilters.push({
      label,
      onRemove: () =>
        setFilters({
          attributes: filters.attributes.filter((a) => a !== attr),
          page: 1,
        }),
    });
  });

  filters.availability.forEach((avail) => {
    const label = avail === 'in_stock' ? 'In Stock' : avail === 'out_of_stock' ? 'Out of Stock' : avail === 'pre_order' ? 'Pre-Order' : avail;
    activeFilters.push({
      label,
      onRemove: () =>
        setFilters({
          availability: filters.availability.filter((a) => a !== avail),
          page: 1,
        }),
    });
  });

  if (activeFilters.length === 0) return null;

  const clearAll = () => {
    setFilters({
      minPrice: 0,
      maxPrice: 999999,
      brands: [],
      attributes: [],
      availability: [],
      page: 1,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="active-filters">
      {activeFilters.map((filter, index) => (
        <FilterBadge key={index} label={filter.label} onRemove={filter.onRemove} />
      ))}
      <button
        onClick={clearAll}
        className="text-xs font-medium text-tertiary hover:text-primary underline underline-offset-2 transition-colors"
        data-testid="clear-all-filters"
      >
        Clear all
      </button>
    </div>
  );
}
