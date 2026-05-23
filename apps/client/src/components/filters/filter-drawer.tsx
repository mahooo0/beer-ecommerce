'use client';

import React, { useState, useEffect } from 'react';
import type { FilterContentProps } from './filter-content';
import { FilterContent } from './filter-content';
import { FilterButton } from './filter-button';
import { useFilters } from '../../hooks/use-filters';

type FilterDrawerProps = FilterContentProps;

const DEFAULT_FILTERS = {
  minPrice: 0,
  maxPrice: 999999,
  brands: [] as string[],
  attributes: [] as string[],
  availability: [] as string[],
  page: 1,
};

function countActiveFilters(filters: {
  minPrice: number;
  maxPrice: number;
  brands: string[];
  attributes: string[];
  availability: string[];
}): number {
  let count = 0;
  if (filters.minPrice > 0 || (filters.maxPrice > 0 && filters.maxPrice !== 999999)) count++;
  count += filters.brands.length;
  count += filters.attributes.length;
  count += filters.availability.length;
  return count;
}

export function FilterDrawer({ categoryAttributes, facetCounts }: FilterDrawerProps) {
  const [filters, setFilters] = useFilters();
  const [open, setOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState({ ...DEFAULT_FILTERS });

  const handleOpen = () => {
    setPendingFilters({
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      brands: [...filters.brands],
      attributes: [...filters.attributes],
      availability: [...filters.availability],
      page: filters.page,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleApply = () => {
    setFilters(pendingFilters);
    setOpen(false);
  };

  const handleClearAll = () => {
    setPendingFilters({ ...DEFAULT_FILTERS });
    setFilters({
      minPrice: 0,
      maxPrice: 999999,
      brands: [],
      attributes: [],
      availability: [],
      page: 1,
    });
  };

  const activeFilterCount = countActiveFilters(filters);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <FilterButton activeFilterCount={activeFilterCount} onClick={handleOpen} />

      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={handleClose}
            aria-hidden="true"
            data-testid="filter-drawer-overlay"
          />

          {/* Drawer */}
          <div
            className="fixed inset-y-0 left-0 z-50 w-full sm:max-w-md bg-primary flex flex-col lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            data-testid="filter-drawer-content"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-secondary">
              <h2 className="text-base font-semibold text-primary">Filters</h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-md text-quaternary hover:text-primary hover:bg-primary_hover focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring transition-colors"
                aria-label="Close filters"
                data-testid="close-drawer-button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <FilterContent
                categoryAttributes={categoryAttributes}
                facetCounts={facetCounts}
              />
            </div>

            {/* Bottom action bar */}
            <div className="px-4 py-3 border-t border-border-secondary flex items-center gap-3">
              <button
                onClick={handleClearAll}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-secondary bg-primary border border-border-primary rounded-lg hover:bg-primary_hover focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring transition-colors"
                data-testid="clear-all-filters-button"
              >
                Clear All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-fg-white bg-brand-solid rounded-lg hover:bg-brand-solid_hover focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring transition-colors"
                data-testid="apply-filters-button"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
